package com.orchiva.workflow.request.application;

import com.orchiva.workflow.common.api.PageResponse;
import com.orchiva.workflow.audit.application.AuditService;
import com.orchiva.workflow.common.error.BusinessRuleException;
import com.orchiva.workflow.common.error.ResourceNotFoundException;
import com.orchiva.workflow.identity.application.CurrentUserService;
import com.orchiva.workflow.identity.domain.RoleName;
import com.orchiva.workflow.identity.domain.UserAccount;
import com.orchiva.workflow.request.api.RequestModels.RequestResponse;
import com.orchiva.workflow.request.api.RequestModels.RequestTypeResponse;
import com.orchiva.workflow.request.api.RequestModels.SaveRequest;
import com.orchiva.workflow.request.domain.BusinessRequest;
import com.orchiva.workflow.request.domain.RequestStatus;
import com.orchiva.workflow.request.domain.RequestType;
import com.orchiva.workflow.request.repository.BusinessRequestRepository;
import com.orchiva.workflow.request.repository.RequestTypeRepository;
import com.orchiva.workflow.workflow.application.WorkflowService;
import jakarta.persistence.criteria.Predicate;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class RequestService {
    private final BusinessRequestRepository requests;
    private final RequestTypeRepository types;
    private final CurrentUserService currentUsers;
    private final JdbcTemplate jdbc;
    private final Clock clock;
    private final WorkflowService workflows;
    private final AuditService audit;

    public RequestService(BusinessRequestRepository requests, RequestTypeRepository types,
                          CurrentUserService currentUsers, JdbcTemplate jdbc, Clock clock,
                          WorkflowService workflows, AuditService audit) {
        this.requests = requests;
        this.types = types;
        this.currentUsers = currentUsers;
        this.jdbc = jdbc;
        this.clock = clock;
        this.workflows = workflows;
        this.audit = audit;
    }

    @Transactional(readOnly = true)
    public List<RequestTypeResponse> listTypes() {
        return types.findAllByActiveTrueOrderByName().stream()
                .map(type -> new RequestTypeResponse(type.getId(), type.getCode(), type.getName(), type.getDescription()))
                .toList();
    }

    public RequestResponse createDraft(SaveRequest input) {
        UserAccount creator = currentUsers.requireCurrentUser();
        if (creator.getDepartment() == null) throw new BusinessRuleException("A department is required to create requests.");
        long sequence = jdbc.queryForObject("SELECT nextval('request_reference_seq')", Long.class);
        String reference = "REQ-%d-%06d".formatted(Instant.now(clock).atZone(ZoneOffset.UTC).getYear(), sequence);
        BusinessRequest request = new BusinessRequest(reference, requireType(input.requestTypeId()),
                input.title().trim(), input.description().trim(), creator, creator.getDepartment());
        request = requests.save(request);
        audit.record(creator, "REQUEST_CREATED", "REQUEST", request.getId(), java.util.Map.of("reference", reference));
        return RequestResponse.from(request);
    }

    public RequestResponse update(UUID id, SaveRequest input) {
        BusinessRequest request = owned(id);
        request.updateDraft(requireType(input.requestTypeId()), input.title().trim(), input.description().trim());
        audit.record(currentUsers.requireCurrentUser(), "REQUEST_UPDATED", "REQUEST", request.getId(), java.util.Map.of());
        return RequestResponse.from(request);
    }

    public RequestResponse submit(UUID id) {
        BusinessRequest request = owned(id);
        request.submit(Instant.now(clock));
        workflows.startOrResume(request);
        return RequestResponse.from(request);
    }

    public RequestResponse cancel(UUID id) {
        BusinessRequest request = owned(id);
        request.cancel(Instant.now(clock));
        audit.record(currentUsers.requireCurrentUser(), "REQUEST_CANCELLED", "REQUEST", request.getId(), java.util.Map.of());
        return RequestResponse.from(request);
    }

    @Transactional(readOnly = true)
    public RequestResponse get(UUID id) {
        BusinessRequest request = requireRequest(id);
        requireView(request, currentUsers.requireCurrentUser());
        return RequestResponse.from(request);
    }

    @Transactional(readOnly = true)
    public PageResponse<RequestResponse> search(String query, RequestStatus status, UUID typeId,
                                                int page, int size) {
        return search(query, status, typeId, page, size, "updatedAt", Sort.Direction.DESC);
    }

    @Transactional(readOnly = true)
    public PageResponse<RequestResponse> search(String query, RequestStatus status, UUID typeId,
                                                int page, int size, String sortBy, Sort.Direction direction) {
        UserAccount actor = currentUsers.requireCurrentUser();
        Specification<BusinessRequest> specification = (root, criteriaQuery, builder) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (!hasAnyRole(actor, RoleName.ADMIN, RoleName.FINANCE)) {
                if (hasAnyRole(actor, RoleName.MANAGER) && actor.getDepartment() != null) {
                    predicates.add(builder.equal(root.get("department").get("id"), actor.getDepartment().getId()));
                } else {
                    predicates.add(builder.equal(root.get("creator").get("id"), actor.getId()));
                }
            }
            if (status != null) predicates.add(builder.equal(root.get("status"), status));
            if (typeId != null) predicates.add(builder.equal(root.get("type").get("id"), typeId));
            if (query != null && !query.isBlank()) {
                String like = "%" + query.trim().toLowerCase(Locale.ROOT) + "%";
                predicates.add(builder.or(builder.like(builder.lower(root.get("title")), like),
                        builder.like(builder.lower(root.get("reference")), like)));
            }
            return builder.and(predicates.toArray(Predicate[]::new));
        };
        String safeSort = switch (sortBy) {
            case "reference", "title", "createdAt", "updatedAt", "status" -> sortBy;
            default -> "updatedAt";
        };
        var result = requests.findAll(specification,
                PageRequest.of(page, Math.min(size, 100), Sort.by(direction, safeSort)))
                .map(RequestResponse::from);
        return PageResponse.from(result);
    }

    public BusinessRequest requireRequest(UUID id) {
        return requests.findById(id).orElseThrow(() -> new ResourceNotFoundException("Request not found."));
    }

    public void requireView(BusinessRequest request, UserAccount actor) {
        boolean allowed = request.getCreator().getId().equals(actor.getId())
                || hasAnyRole(actor, RoleName.ADMIN, RoleName.FINANCE)
                || (hasAnyRole(actor, RoleName.MANAGER) && actor.getDepartment() != null
                    && actor.getDepartment().getId().equals(request.getDepartment().getId()));
        if (!allowed) throw new AccessDeniedException("Request is not accessible.");
    }

    private BusinessRequest owned(UUID id) {
        BusinessRequest request = requireRequest(id);
        if (!request.getCreator().getId().equals(currentUsers.id())) {
            throw new AccessDeniedException("Only the creator can modify this request.");
        }
        return request;
    }

    private RequestType requireType(UUID id) {
        return types.findByIdAndActiveTrue(id)
                .orElseThrow(() -> new ResourceNotFoundException("Active request type not found."));
    }

    private boolean hasAnyRole(UserAccount user, RoleName... roles) {
        return user.getRoles().stream().anyMatch(role -> java.util.Arrays.asList(roles).contains(role.getName()));
    }
}
