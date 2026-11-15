package com.orchiva.workflow.document.domain;

import com.orchiva.workflow.identity.domain.UserAccount;
import com.orchiva.workflow.request.domain.BusinessRequest;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Entity @Table(name = "documents")
public class Document {
    @Id @GeneratedValue private UUID id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "request_id") private BusinessRequest request;
    @Column(nullable = false, length = 180) private String title;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "created_by") private UserAccount createdBy;
    @Column(name = "latest_version_number", nullable = false) private int latestVersionNumber;
    @OneToMany(mappedBy = "document", cascade = CascadeType.ALL) @OrderBy("versionNumber DESC") private List<DocumentVersion> versions = new ArrayList<>();
    @CreationTimestamp @Column(nullable = false, updatable = false) private Instant createdAt;
    @UpdateTimestamp @Column(nullable = false) private Instant updatedAt;
    protected Document() {}
    public Document(BusinessRequest request, String title, UserAccount createdBy) { this.request = request; this.title = title; this.createdBy = createdBy; }
    public DocumentVersion addVersion(String originalName, String storedName, String contentType,
                                      long size, String sha256, UserAccount actor) {
        latestVersionNumber++;
        DocumentVersion version = new DocumentVersion(this, latestVersionNumber, originalName, storedName, contentType, size, sha256, actor);
        versions.add(version);
        return version;
    }
    public UUID getId() { return id; }
    public BusinessRequest getRequest() { return request; }
    public String getTitle() { return title; }
    public UserAccount getCreatedBy() { return createdBy; }
    public int getLatestVersionNumber() { return latestVersionNumber; }
    public List<DocumentVersion> getVersions() { return List.copyOf(versions); }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
