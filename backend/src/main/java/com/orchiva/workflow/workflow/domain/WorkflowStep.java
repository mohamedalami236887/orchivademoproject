package com.orchiva.workflow.workflow.domain;

import com.orchiva.workflow.identity.domain.RoleName;
import jakarta.persistence.*;
import java.util.UUID;

@Entity @Table(name = "workflow_steps")
public class WorkflowStep {
    @Id @GeneratedValue private UUID id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "workflow_version_id") private WorkflowVersion version;
    @Column(nullable = false) private int position;
    @Column(nullable = false, length = 140) private String name;
    @Enumerated(EnumType.STRING) @Column(name = "approver_role", nullable = false, length = 30) private RoleName approverRole;

    protected WorkflowStep() {}
    WorkflowStep(WorkflowVersion version, String name, int position, RoleName approverRole) {
        this.version = version; this.name = name; this.position = position; this.approverRole = approverRole;
    }
    public UUID getId() { return id; }
    public int getPosition() { return position; }
    public String getName() { return name; }
    public RoleName getApproverRole() { return approverRole; }
}
