package com.orchiva.workflow.workflow.api;

import com.orchiva.workflow.identity.domain.RoleName;
import com.orchiva.workflow.workflow.domain.ApprovalTask;
import com.orchiva.workflow.workflow.domain.DecisionType;
import com.orchiva.workflow.workflow.domain.TaskStatus;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public final class WorkflowModels {
    private WorkflowModels() {}
    public record StepInput(@NotBlank @Size(max = 140) String name, @NotNull RoleName approverRole) {}
    public record PublishWorkflowRequest(@NotNull UUID requestTypeId, @NotBlank @Size(max = 160) String name,
                                         @NotEmpty List<@Valid StepInput> steps) {}
    public record DecisionRequest(@NotNull DecisionType decision, @Size(max = 2000) String comments) {}
    public record TaskResponse(UUID id, UUID requestId, String reference, String requestTitle,
                               String requestType, String requester, String department,
                               String requestDescription, Instant submittedAt,
                               String stepName, RoleName assigneeRole, TaskStatus status, int attempt,
                               Instant createdAt, Instant decidedAt) {
        public static TaskResponse from(ApprovalTask task) {
            var request = task.getInstance().getRequest();
            return new TaskResponse(task.getId(), request.getId(), request.getReference(), request.getTitle(),
                    request.getType().getName(),
                    request.getCreator().getFirstName() + " " + request.getCreator().getLastName(),
                    request.getDepartment().getName(), request.getDescription(), request.getSubmittedAt(),
                    task.getStep().getName(), task.getAssigneeRole(), task.getStatus(), task.getAttempt(),
                    task.getCreatedAt(), task.getDecidedAt());
        }
    }
    public record WorkflowResponse(UUID id, String name, UUID requestTypeId, String requestType,
                                   int currentVersion, List<StepInput> steps) {}
}
