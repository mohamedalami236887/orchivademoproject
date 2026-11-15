package com.orchiva.workflow.request.api;

import com.orchiva.workflow.request.api.RequestModels.RequestResponse;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public final class RequestWorkspaceModels {
    private RequestWorkspaceModels() {}

    public record RequestWorkspaceResponse(RequestResponse request, WorkflowSummary workflow,
                                           List<WorkflowStepProgress> steps,
                                           List<ApprovalHistoryItem> approvals,
                                           List<ActivityItem> activity) {}

    public record WorkflowSummary(String name, int version, String status, int currentStep,
                                  int attempt, Instant startedAt, Instant completedAt) {}

    public record WorkflowStepProgress(int position, String name, String approverRole,
                                       String status, int attempt, String actor,
                                       Instant createdAt, Instant decidedAt, String comments) {}

    public record ApprovalHistoryItem(UUID id, int attempt, int stepPosition, String stepName,
                                      String actor, String decision, String comments, Instant decidedAt) {}

    public record ActivityItem(UUID id, String action, String actor, Instant occurredAt,
                               String targetType, String targetId, String metadata) {}
}
