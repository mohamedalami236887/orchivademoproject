package com.orchiva.workflow.workflow.application;

import com.orchiva.workflow.audit.application.AuditService;
import com.orchiva.workflow.common.error.BusinessRuleException;
import com.orchiva.workflow.common.error.ResourceNotFoundException;
import com.orchiva.workflow.identity.application.CurrentUserService;
import com.orchiva.workflow.identity.domain.RoleName;
import com.orchiva.workflow.identity.domain.UserAccount;
import com.orchiva.workflow.identity.repository.UserAccountRepository;
import com.orchiva.workflow.notification.domain.Notification;
import com.orchiva.workflow.notification.repository.NotificationRepository;
import com.orchiva.workflow.request.domain.BusinessRequest;
import com.orchiva.workflow.workflow.api.WorkflowModels.DecisionRequest;
import com.orchiva.workflow.workflow.api.WorkflowModels.TaskResponse;
import com.orchiva.workflow.workflow.domain.*;
import com.orchiva.workflow.workflow.repository.*;
import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class WorkflowService {
    private final WorkflowDefinitionRepository definitions;
    private final WorkflowInstanceRepository instances;
    private final ApprovalTaskRepository tasks;
    private final ApprovalDecisionRepository decisions;
    private final NotificationRepository notifications;
    private final CurrentUserService currentUsers;
    private final UserAccountRepository users;
    private final AuditService audit;
    private final Clock clock;

    public WorkflowService(WorkflowDefinitionRepository definitions, WorkflowInstanceRepository instances,
                           ApprovalTaskRepository tasks, ApprovalDecisionRepository decisions,
                           NotificationRepository notifications, CurrentUserService currentUsers,
                           UserAccountRepository users,
                           AuditService audit, Clock clock) {
        this.definitions = definitions; this.instances = instances; this.tasks = tasks; this.decisions = decisions;
        this.notifications = notifications; this.currentUsers = currentUsers; this.users = users;
        this.audit = audit; this.clock = clock;
    }

    public void startOrResume(BusinessRequest request) {
        UserAccount actor = currentUsers.requireCurrentUser();
        WorkflowInstance instance = instances.findByRequestId(request.getId()).orElse(null);
        if (instance != null) {
            instance.resume();
            WorkflowStep first = instance.getWorkflowVersion().getSteps().getFirst();
            tasks.save(new ApprovalTask(instance, first));
            notifyApprovers(request, first.getApproverRole());
            request.markInReview();
            audit.record(actor, "WORKFLOW_RESUBMITTED", "REQUEST", request.getId(), Map.of("attempt", instance.getAttempt()));
            return;
        }
        WorkflowDefinition definition = definitions.findByRequestTypeIdAndActiveTrue(request.getType().getId())
                .orElseThrow(() -> new BusinessRuleException("No published workflow is configured for this request type."));
        WorkflowVersion version = definition.getCurrentVersion();
        if (version == null || !version.isPublished() || version.getSteps().isEmpty()) {
            throw new BusinessRuleException("The request type has no usable published workflow version.");
        }
        instance = instances.save(new WorkflowInstance(request, version));
        tasks.save(new ApprovalTask(instance, version.getSteps().getFirst()));
        notifyApprovers(request, version.getSteps().getFirst().getApproverRole());
        request.markInReview();
        audit.record(actor, "WORKFLOW_STARTED", "REQUEST", request.getId(), Map.of("workflowVersion", version.getVersionNumber()));
    }

    @Transactional(readOnly = true)
    public List<TaskResponse> inbox() {
        UserAccount actor = currentUsers.requireCurrentUser();
        List<RoleName> roles = actor.getRoles().stream().map(role -> role.getName())
                .filter(role -> role != RoleName.EMPLOYEE).toList();
        return tasks.findAllByAssigneeRoleInAndStatusOrderByCreatedAtDesc(roles, TaskStatus.PENDING).stream()
                .filter(task -> task.getAssigneeRole() != RoleName.MANAGER
                        || (task.getInstance().getRequest().getDepartment().getManagerId() != null
                            && task.getInstance().getRequest().getDepartment().getManagerId().equals(actor.getId())))
                .map(TaskResponse::from).toList();
    }

    public TaskResponse decide(UUID taskId, DecisionRequest input) {
        UserAccount actor = currentUsers.requireCurrentUser();
        ApprovalTask task = tasks.findLockedById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Approval task not found."));
        authorize(task, actor);
        Instant now = Instant.now(clock);
        task.decide(input.decision(), actor, now);
        decisions.save(new ApprovalDecision(task, actor, input.decision(), normalize(input.comments())));
        WorkflowInstance instance = task.getInstance();
        BusinessRequest request = instance.getRequest();

        switch (input.decision()) {
            case APPROVED -> advanceOrComplete(instance, request, now);
            case REJECTED -> { instance.complete(WorkflowStatus.REJECTED, now); request.reject(now); notifyCreator(request, "REQUEST_REJECTED", "Request rejected", "Your request " + request.getReference() + " was rejected."); }
            case CHANGES_REQUESTED -> { instance.complete(WorkflowStatus.CHANGES_REQUESTED, now); request.requestChanges(); notifyCreator(request, "CHANGES_REQUESTED", "Changes requested", "Changes were requested for " + request.getReference() + "."); }
        }
        audit.record(actor, "APPROVAL_" + input.decision().name(), "REQUEST", request.getId(),
                Map.of("taskId", task.getId(), "step", task.getStep().getName(), "attempt", task.getAttempt()));
        return TaskResponse.from(task);
    }

    private void advanceOrComplete(WorkflowInstance instance, BusinessRequest request, Instant now) {
        List<WorkflowStep> steps = instance.getWorkflowVersion().getSteps();
        int nextPosition = instance.getCurrentStepPosition() + 1;
        if (nextPosition > steps.size()) {
            instance.complete(WorkflowStatus.APPROVED, now);
            request.approve(now);
            notifyCreator(request, "REQUEST_APPROVED", "Request approved", "Your request " + request.getReference() + " was approved.");
        } else {
            instance.advance();
            WorkflowStep next = steps.stream().filter(step -> step.getPosition() == nextPosition).findFirst()
                    .orElseThrow(() -> new BusinessRuleException("Workflow step sequence is invalid."));
            tasks.save(new ApprovalTask(instance, next));
            notifyApprovers(request, next.getApproverRole());
        }
    }

    private void authorize(ApprovalTask task, UserAccount actor) {
        boolean role = actor.getRoles().stream().anyMatch(value -> value.getName() == task.getAssigneeRole() || value.getName() == RoleName.ADMIN);
        boolean managerScope = task.getAssigneeRole() != RoleName.MANAGER
                || actor.getRoles().stream().anyMatch(value -> value.getName() == RoleName.ADMIN)
                || actor.getId().equals(task.getInstance().getRequest().getDepartment().getManagerId());
        if (!role || !managerScope) throw new AccessDeniedException("This approval task is not assigned to you.");
    }

    private void notifyCreator(BusinessRequest request, String type, String title, String message) {
        notifications.save(new Notification(request.getCreator(), type, title, message, "/requests/" + request.getId()));
    }

    private void notifyApprovers(BusinessRequest request, RoleName role) {
        List<UserAccount> recipients;
        if (role == RoleName.MANAGER && request.getDepartment().getManagerId() != null) {
            recipients = users.findById(request.getDepartment().getManagerId()).map(List::of).orElse(List.of());
        } else {
            recipients = users.findDistinctByRolesNameAndEnabledTrue(role);
        }
        recipients.forEach(recipient -> notifications.save(new Notification(recipient, "APPROVAL_ASSIGNED",
                "Request awaiting review", request.getReference() + " requires your decision.",
                "/requests/" + request.getId())));
    }

    private String normalize(String comments) { return comments == null || comments.isBlank() ? null : comments.trim(); }
}
