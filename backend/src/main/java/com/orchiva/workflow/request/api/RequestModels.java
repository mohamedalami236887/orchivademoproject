package com.orchiva.workflow.request.api;

import com.orchiva.workflow.request.domain.BusinessRequest;
import com.orchiva.workflow.request.domain.RequestStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.UUID;

public final class RequestModels {
    private RequestModels() {}

    public record SaveRequest(@NotNull UUID requestTypeId,
                              @NotBlank @Size(max = 180) String title,
                              @NotBlank @Size(max = 10000) String description) {}

    public record RequestResponse(UUID id, String reference, UUID requestTypeId, String requestType,
                                  String title, String description, UUID creatorId, String creatorName,
                                  UUID departmentId, String departmentName, RequestStatus status,
                                  long version, Instant createdAt, Instant updatedAt, Instant submittedAt,
                                  Instant completedAt) {
        public static RequestResponse from(BusinessRequest request) {
            return new RequestResponse(request.getId(), request.getReference(), request.getType().getId(),
                    request.getType().getName(), request.getTitle(), request.getDescription(),
                    request.getCreator().getId(), request.getCreator().getFirstName() + " " + request.getCreator().getLastName(),
                    request.getDepartment().getId(), request.getDepartment().getName(), request.getStatus(),
                    request.getVersion(), request.getCreatedAt(), request.getUpdatedAt(), request.getSubmittedAt(),
                    request.getCompletedAt());
        }
    }

    public record RequestTypeResponse(UUID id, String code, String name, String description) {}
}
