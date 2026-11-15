package com.orchiva.workflow.document.api;

import com.orchiva.workflow.document.domain.Document;
import com.orchiva.workflow.document.domain.DocumentVersion;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public final class DocumentModels {
    private DocumentModels() {}
    public record VersionResponse(UUID id, int version, String filename, String contentType,
                                  long size, String sha256, String uploadedBy, Instant createdAt) {
        static VersionResponse from(DocumentVersion version) {
            return new VersionResponse(version.getId(), version.getVersionNumber(), version.getOriginalFilename(),
                    version.getContentType(), version.getSizeBytes(), version.getSha256(),
                    version.getUploadedBy().getFirstName() + " " + version.getUploadedBy().getLastName(),
                    version.getCreatedAt());
        }
    }
    public record DocumentResponse(UUID id, UUID requestId, String requestReference, String title,
                                   int latestVersion, Instant createdAt, Instant updatedAt,
                                   List<VersionResponse> versions) {
        public static DocumentResponse from(Document document) {
            return new DocumentResponse(document.getId(), document.getRequest().getId(),
                    document.getRequest().getReference(), document.getTitle(), document.getLatestVersionNumber(),
                    document.getCreatedAt(), document.getUpdatedAt(),
                    document.getVersions().stream().map(VersionResponse::from).toList());
        }
    }
    public record Download(PathInfo path, String filename, String contentType, long size) {}
    public record PathInfo(java.nio.file.Path value) {}
}
