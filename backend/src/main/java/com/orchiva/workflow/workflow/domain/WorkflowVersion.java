package com.orchiva.workflow.workflow.domain;

import com.orchiva.workflow.identity.domain.UserAccount;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.hibernate.annotations.CreationTimestamp;

@Entity @Table(name = "workflow_versions")
public class WorkflowVersion {
    @Id @GeneratedValue private UUID id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "definition_id") private WorkflowDefinition definition;
    @Column(name = "version_number", nullable = false) private int versionNumber;
    @Column(nullable = false) private boolean published;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "created_by") private UserAccount createdBy;
    @OneToMany(mappedBy = "version", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("position ASC") private List<WorkflowStep> steps = new ArrayList<>();
    @CreationTimestamp @Column(nullable = false, updatable = false) private Instant createdAt;

    protected WorkflowVersion() {}
    public WorkflowVersion(WorkflowDefinition definition, int versionNumber, UserAccount createdBy) {
        this.definition = definition; this.versionNumber = versionNumber; this.createdBy = createdBy;
    }
    public void addStep(String name, int position, com.orchiva.workflow.identity.domain.RoleName role) {
        steps.add(new WorkflowStep(this, name, position, role));
    }
    public void publish() { this.published = true; }
    public UUID getId() { return id; }
    public int getVersionNumber() { return versionNumber; }
    public boolean isPublished() { return published; }
    public List<WorkflowStep> getSteps() { return List.copyOf(steps); }
    public WorkflowDefinition getDefinition() { return definition; }
}
