package com.orchiva.workflow.notification.domain;

import com.orchiva.workflow.identity.domain.UserAccount;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.CreationTimestamp;

@Entity @Table(name = "notifications")
public class Notification {
    @Id @GeneratedValue private UUID id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "recipient_id") private UserAccount recipient;
    @Column(nullable = false, length = 60) private String type;
    @Column(nullable = false, length = 180) private String title;
    @Column(nullable = false, length = 1000) private String message;
    @Column(name = "target_url", length = 300) private String targetUrl;
    private Instant readAt;
    @CreationTimestamp @Column(nullable = false, updatable = false) private Instant createdAt;
    protected Notification() {}
    public Notification(UserAccount recipient, String type, String title, String message, String targetUrl) {
        this.recipient = recipient; this.type = type; this.title = title; this.message = message; this.targetUrl = targetUrl;
    }
    public void markRead(Instant at) { if (readAt == null) readAt = at; }
    public UUID getId() { return id; }
    public String getType() { return type; }
    public String getTitle() { return title; }
    public String getMessage() { return message; }
    public String getTargetUrl() { return targetUrl; }
    public Instant getReadAt() { return readAt; }
    public Instant getCreatedAt() { return createdAt; }
}
