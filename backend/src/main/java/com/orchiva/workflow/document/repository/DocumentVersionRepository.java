package com.orchiva.workflow.document.repository;

import com.orchiva.workflow.document.domain.DocumentVersion;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DocumentVersionRepository extends JpaRepository<DocumentVersion, UUID> {
    Optional<DocumentVersion> findByDocumentIdAndVersionNumber(UUID documentId, int versionNumber);
}
