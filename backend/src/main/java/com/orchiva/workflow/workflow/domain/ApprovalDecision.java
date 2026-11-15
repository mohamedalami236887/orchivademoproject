package com.orchiva.workflow.workflow.domain;

import com.orchiva.workflow.identity.domain.UserAccount;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.CreationTimestamp;

@Entity @Table(name = "approval_decisions")
public class ApprovalDecision {
    @Id @GeneratedValue private UUID id;
    @OneToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "approval_task_id") private ApprovalTask task;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "actor_id") private UserAccount actor;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 30) private DecisionType decision;
    @Column(length = 2000) private String comments;
    @CreationTimestamp @Column(nullable = false, updatable = false) private Instant decidedAt;
    protected ApprovalDecision() {}
    public ApprovalDecision(ApprovalTask task, UserAccount actor, DecisionType decision, String comments) {
        this.task = task; this.actor = actor; this.decision = decision; this.comments = comments;
    }
    public UUID getId() { return id; }
    public DecisionType getDecision() { return decision; }
    public String getComments() { return comments; }
    public Instant getDecidedAt() { return decidedAt; }
}
