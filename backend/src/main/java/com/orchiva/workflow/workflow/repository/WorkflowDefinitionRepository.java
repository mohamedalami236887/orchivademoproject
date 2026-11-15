package com.orchiva.workflow.workflow.repository;

import com.orchiva.workflow.workflow.domain.WorkflowDefinition;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WorkflowDefinitionRepository extends JpaRepository<WorkflowDefinition, UUID> {
    @EntityGraph(attributePaths = {"currentVersion", "currentVersion.steps", "requestType"})
    Optional<WorkflowDefinition> findByRequestTypeIdAndActiveTrue(UUID requestTypeId);
    boolean existsByRequestTypeId(UUID requestTypeId);
}
