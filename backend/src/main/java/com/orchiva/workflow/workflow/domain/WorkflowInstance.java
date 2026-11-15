package com.orchiva.workflow.workflow.domain;

import com.orchiva.workflow.common.error.BusinessRuleException;
import com.orchiva.workflow.request.domain.BusinessRequest;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.CreationTimestamp;

@Entity @Table(name = "workflow_instances")
public class WorkflowInstance {
    @Id @GeneratedValue private UUID id;
    @OneToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "request_id") private BusinessRequest request;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "workflow_version_id") private WorkflowVersion workflowVersion;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 30) private WorkflowStatus status = WorkflowStatus.IN_PROGRESS;
    @Column(name = "current_step_position", nullable = false) private int currentStepPosition = 1;
    @Column(nullable = false) private int attempt = 1;
    @Version private long version;
    @CreationTimestamp @Column(nullable = false, updatable = false) private Instant startedAt;
    private Instant completedAt;

    protected WorkflowInstance() {}
    public WorkflowInstance(BusinessRequest request, WorkflowVersion version) { this.request = request; this.workflowVersion = version; }
    public void advance() { requireActive(); currentStepPosition++; }
    public void resume() {
        if (status != WorkflowStatus.CHANGES_REQUESTED) throw new BusinessRuleException("Only a change-requested workflow can resume.");
        status = WorkflowStatus.IN_PROGRESS; currentStepPosition = 1; completedAt = null; attempt++;
    }
    public void complete(WorkflowStatus terminal, Instant at) {
        requireActive();
        if (terminal == WorkflowStatus.IN_PROGRESS) throw new BusinessRuleException("Terminal workflow status required.");
        status = terminal; completedAt = at;
    }
    private void requireActive() { if (status != WorkflowStatus.IN_PROGRESS) throw new BusinessRuleException("Workflow is already complete."); }
    public UUID getId() { return id; }
    public BusinessRequest getRequest() { return request; }
    public WorkflowVersion getWorkflowVersion() { return workflowVersion; }
    public WorkflowStatus getStatus() { return status; }
    public int getCurrentStepPosition() { return currentStepPosition; }
    public int getAttempt() { return attempt; }
    public Instant getStartedAt() { return startedAt; }
    public Instant getCompletedAt() { return completedAt; }
}
