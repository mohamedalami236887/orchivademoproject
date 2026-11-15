package com.orchiva.workflow.document.repository;

import com.orchiva.workflow.document.domain.Document;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DocumentRepository extends JpaRepository<Document, UUID> {
    @EntityGraph(attributePaths = {"versions", "request", "request.creator", "request.department"})
    List<Document> findAllByRequestIdOrderByUpdatedAtDesc(UUID requestId);
    @EntityGraph(attributePaths = {"versions", "request", "request.creator", "request.department"})
    List<Document> findByTitleContainingIgnoreCaseOrderByUpdatedAtDesc(String query);
}
