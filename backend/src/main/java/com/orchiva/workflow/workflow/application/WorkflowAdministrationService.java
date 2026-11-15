package com.orchiva.workflow.workflow.application;

import com.orchiva.workflow.audit.application.AuditService;
import com.orchiva.workflow.common.error.BusinessRuleException;
import com.orchiva.workflow.identity.application.CurrentUserService;
import com.orchiva.workflow.identity.domain.RoleName;
import com.orchiva.workflow.identity.domain.UserAccount;
import com.orchiva.workflow.request.domain.RequestType;
import com.orchiva.workflow.request.repository.RequestTypeRepository;
import com.orchiva.workflow.workflow.api.WorkflowModels.PublishWorkflowRequest;
import com.orchiva.workflow.workflow.api.WorkflowModels.StepInput;
import com.orchiva.workflow.workflow.api.WorkflowModels.WorkflowResponse;
import com.orchiva.workflow.workflow.domain.WorkflowDefinition;
import com.orchiva.workflow.workflow.domain.WorkflowVersion;
import com.orchiva.workflow.workflow.repository.WorkflowDefinitionRepository;
import com.orchiva.workflow.workflow.repository.WorkflowVersionRepository;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class WorkflowAdministrationService {
    private final WorkflowDefinitionRepository definitions;
    private final WorkflowVersionRepository versions;
    private final RequestTypeRepository requestTypes;
    private final CurrentUserService currentUsers;
    private final AuditService audit;

    public WorkflowAdministrationService(WorkflowDefinitionRepository definitions,
                                         WorkflowVersionRepository versions, RequestTypeRepository requestTypes,
                                         CurrentUserService currentUsers, AuditService audit) {
        this.definitions = definitions; this.versions = versions; this.requestTypes = requestTypes;
        this.currentUsers = currentUsers; this.audit = audit;
    }

    @Transactional(readOnly = true)
    public List<WorkflowResponse> list() {
        return definitions.findAll().stream().map(this::response).toList();
    }

    public WorkflowResponse publish(PublishWorkflowRequest input) {
        if (input.steps().stream().anyMatch(step -> step.approverRole() == RoleName.EMPLOYEE)) {
            throw new BusinessRuleException("Employee cannot be configured as an approver role.");
        }
        RequestType type = requestTypes.findByIdAndActiveTrue(input.requestTypeId())
                .orElseThrow(() -> new com.orchiva.workflow.common.error.ResourceNotFoundException("Request type not found."));
        WorkflowDefinition definition = definitions.findByRequestTypeIdAndActiveTrue(type.getId())
                .orElseGet(() -> definitions.save(new WorkflowDefinition(type, input.name().trim())));
        UserAccount actor = currentUsers.requireCurrentUser();
        int versionNumber = versions.countByDefinitionId(definition.getId()) + 1;
        WorkflowVersion version = new WorkflowVersion(definition, versionNumber, actor);
        for (int index = 0; index < input.steps().size(); index++) {
            StepInput step = input.steps().get(index);
            version.addStep(step.name().trim(), index + 1, step.approverRole());
        }
        version.publish();
        versions.save(version);
        definition.publish(version);
        audit.record(actor, "WORKFLOW_PUBLISHED", "WORKFLOW_DEFINITION", definition.getId(),
                Map.of("version", versionNumber, "steps", input.steps().size()));
        return response(definition);
    }

    private WorkflowResponse response(WorkflowDefinition definition) {
        WorkflowVersion version = definition.getCurrentVersion();
        return new WorkflowResponse(definition.getId(), definition.getName(), definition.getRequestType().getId(),
                definition.getRequestType().getName(), version == null ? 0 : version.getVersionNumber(),
                version == null ? List.of() : version.getSteps().stream()
                        .map(step -> new StepInput(step.getName(), step.getApproverRole())).toList());
    }
}
