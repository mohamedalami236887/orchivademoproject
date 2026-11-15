package com.orchiva.workflow.request.domain;

import com.orchiva.workflow.common.error.BusinessRuleException;
import com.orchiva.workflow.department.domain.Department;
import com.orchiva.workflow.identity.domain.UserAccount;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Entity
@Table(name = "requests")
public class BusinessRequest {
    @Id @GeneratedValue private UUID id;
    @Column(nullable = false, unique = true, length = 30) private String reference;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "request_type_id") private RequestType type;
    @Column(nullable = false, length = 180) private String title;
    @Column(nullable = false, columnDefinition = "text") private String description;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "creator_id") private UserAccount creator;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "department_id") private Department department;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 30) private RequestStatus status = RequestStatus.DRAFT;
    private Instant submittedAt;
    private Instant completedAt;
    @Version private long version;
    @CreationTimestamp @Column(nullable = false, updatable = false) private Instant createdAt;
    @UpdateTimestamp @Column(nullable = false) private Instant updatedAt;

    protected BusinessRequest() {}

    public BusinessRequest(String reference, RequestType type, String title, String description,
                           UserAccount creator, Department department) {
        this.reference = reference;
        this.type = type;
        this.title = title;
        this.description = description;
        this.creator = creator;
        this.department = department;
    }

    public void updateDraft(RequestType type, String title, String description) {
        requireStatus(RequestStatus.DRAFT, RequestStatus.CHANGES_REQUESTED);
        this.type = type;
        this.title = title;
        this.description = description;
    }

    public void submit(Instant now) {
        requireStatus(RequestStatus.DRAFT, RequestStatus.CHANGES_REQUESTED);
        status = RequestStatus.SUBMITTED;
        submittedAt = now;
        completedAt = null;
    }

    public void cancel(Instant now) {
        requireStatus(RequestStatus.DRAFT, RequestStatus.SUBMITTED, RequestStatus.CHANGES_REQUESTED);
        status = RequestStatus.CANCELLED;
        completedAt = now;
    }

    public void markInReview() {
        requireStatus(RequestStatus.SUBMITTED);
        status = RequestStatus.IN_REVIEW;
    }

    public void approve(Instant now) { requireStatus(RequestStatus.IN_REVIEW); status = RequestStatus.APPROVED; completedAt = now; }
    public void reject(Instant now) { requireStatus(RequestStatus.IN_REVIEW); status = RequestStatus.REJECTED; completedAt = now; }
    public void requestChanges() { requireStatus(RequestStatus.IN_REVIEW); status = RequestStatus.CHANGES_REQUESTED; }

    private void requireStatus(RequestStatus... allowed) {
        if (java.util.Arrays.stream(allowed).noneMatch(value -> value == status)) {
            throw new BusinessRuleException("Request cannot transition from " + status + " for this operation.");
        }
    }

    public UUID getId() { return id; }
    public String getReference() { return reference; }
    public RequestType getType() { return type; }
    public String getTitle() { return title; }
    public String getDescription() { return description; }
    public UserAccount getCreator() { return creator; }
    public Department getDepartment() { return department; }
    public RequestStatus getStatus() { return status; }
    public Instant getSubmittedAt() { return submittedAt; }
    public Instant getCompletedAt() { return completedAt; }
    public long getVersion() { return version; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
