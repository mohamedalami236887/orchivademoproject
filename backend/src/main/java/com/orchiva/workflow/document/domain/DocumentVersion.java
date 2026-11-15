package com.orchiva.workflow.document.domain;

import com.orchiva.workflow.identity.domain.UserAccount;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.CreationTimestamp;

@Entity @Table(name = "document_versions")
public class DocumentVersion {
    @Id @GeneratedValue private UUID id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "document_id") private Document document;
    @Column(name = "version_number", nullable = false) private int versionNumber;
    @Column(name = "original_filename", nullable = false, length = 255) private String originalFilename;
    @Column(name = "stored_filename", nullable = false, unique = true, length = 255) private String storedFilename;
    @Column(name = "content_type", nullable = false, length = 120) private String contentType;
    @Column(name = "size_bytes", nullable = false) private long sizeBytes;
    @Column(nullable = false, length = 64) private String sha256;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "uploaded_by") private UserAccount uploadedBy;
    @CreationTimestamp @Column(nullable = false, updatable = false) private Instant createdAt;
    protected DocumentVersion() {}
    DocumentVersion(Document document, int versionNumber, String originalFilename, String storedFilename,
                    String contentType, long sizeBytes, String sha256, UserAccount uploadedBy) {
        this.document = document; this.versionNumber = versionNumber; this.originalFilename = originalFilename;
        this.storedFilename = storedFilename; this.contentType = contentType; this.sizeBytes = sizeBytes;
        this.sha256 = sha256; this.uploadedBy = uploadedBy;
    }
    public UUID getId() { return id; }
    public int getVersionNumber() { return versionNumber; }
    public String getOriginalFilename() { return originalFilename; }
    public String getStoredFilename() { return storedFilename; }
    public String getContentType() { return contentType; }
    public long getSizeBytes() { return sizeBytes; }
    public String getSha256() { return sha256; }
    public UserAccount getUploadedBy() { return uploadedBy; }
    public Instant getCreatedAt() { return createdAt; }
}
