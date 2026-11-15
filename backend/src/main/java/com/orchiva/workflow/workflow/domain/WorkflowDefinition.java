package com.orchiva.workflow.workflow.domain;

import com.orchiva.workflow.request.domain.RequestType;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Entity @Table(name = "workflow_definitions")
public class WorkflowDefinition {
    @Id @GeneratedValue private UUID id;
    @OneToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "request_type_id") private RequestType requestType;
    @Column(nullable = false, length = 160) private String name;
    @Column(nullable = false) private boolean active = true;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "current_version_id") private WorkflowVersion currentVersion;
    @CreationTimestamp @Column(nullable = false, updatable = false) private Instant createdAt;
    @UpdateTimestamp @Column(nullable = false) private Instant updatedAt;

    protected WorkflowDefinition() {}
    public WorkflowDefinition(RequestType requestType, String name) { this.requestType = requestType; this.name = name; }
    public void publish(WorkflowVersion version) { this.currentVersion = version; this.active = true; }
    public UUID getId() { return id; }
    public RequestType getRequestType() { return requestType; }
    public String getName() { return name; }
    public boolean isActive() { return active; }
    public WorkflowVersion getCurrentVersion() { return currentVersion; }
}
