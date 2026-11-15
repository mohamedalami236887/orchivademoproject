package com.orchiva.workflow.workflow.domain;

import com.orchiva.workflow.common.error.BusinessRuleException;
import com.orchiva.workflow.identity.domain.RoleName;
import com.orchiva.workflow.identity.domain.UserAccount;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.CreationTimestamp;

@Entity @Table(name = "approval_tasks")
public class ApprovalTask {
    @Id @GeneratedValue private UUID id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "workflow_instance_id") private WorkflowInstance instance;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "workflow_step_id") private WorkflowStep step;
    @Enumerated(EnumType.STRING) @Column(name = "assignee_role", nullable = false, length = 30) private RoleName assigneeRole;
    @Column(nullable = false) private int attempt;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 30) private TaskStatus status = TaskStatus.PENDING;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "decided_by") private UserAccount decidedBy;
    @Version private long version;
    @CreationTimestamp @Column(nullable = false, updatable = false) private Instant createdAt;
    private Instant decidedAt;

    protected ApprovalTask() {}
    public ApprovalTask(WorkflowInstance instance, WorkflowStep step) { this.instance = instance; this.step = step; this.assigneeRole = step.getApproverRole(); this.attempt = instance.getAttempt(); }
    public void decide(DecisionType decision, UserAccount actor, Instant at) {
        if (status != TaskStatus.PENDING) throw new BusinessRuleException("Approval task has already been decided.");
        status = TaskStatus.valueOf(decision.name()); decidedBy = actor; decidedAt = at;
    }
    public UUID getId() { return id; }
    public WorkflowInstance getInstance() { return instance; }
    public WorkflowStep getStep() { return step; }
    public RoleName getAssigneeRole() { return assigneeRole; }
    public int getAttempt() { return attempt; }
    public TaskStatus getStatus() { return status; }
    public UserAccount getDecidedBy() { return decidedBy; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getDecidedAt() { return decidedAt; }
}
