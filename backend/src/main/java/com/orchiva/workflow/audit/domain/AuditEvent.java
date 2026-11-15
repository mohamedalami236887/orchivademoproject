package com.orchiva.workflow.audit.domain;

import com.orchiva.workflow.identity.domain.UserAccount;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity @Table(name = "audit_events")
public class AuditEvent {
    @Id @GeneratedValue private UUID id;
    @CreationTimestamp @Column(nullable = false, updatable = false) private Instant occurredAt;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "actor_id") private UserAccount actor;
    @Column(nullable = false, length = 80) private String action;
    @Column(name = "target_type", nullable = false, length = 80) private String targetType;
    @Column(name = "target_id", length = 80) private String targetId;
    @JdbcTypeCode(SqlTypes.JSON) @Column(nullable = false, columnDefinition = "jsonb") private String metadata = "{}";
    protected AuditEvent() {}
    public AuditEvent(UserAccount actor, String action, String targetType, String targetId, String metadata) {
        this.actor = actor; this.action = action; this.targetType = targetType; this.targetId = targetId; this.metadata = metadata;
    }
    public UUID getId() { return id; }
    public Instant getOccurredAt() { return occurredAt; }
    public UserAccount getActor() { return actor; }
    public String getAction() { return action; }
    public String getTargetType() { return targetType; }
    public String getTargetId() { return targetId; }
    public String getMetadata() { return metadata; }
}
