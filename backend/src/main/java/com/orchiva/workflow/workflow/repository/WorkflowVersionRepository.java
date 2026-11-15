package com.orchiva.workflow.workflow.repository;

import com.orchiva.workflow.workflow.domain.WorkflowVersion;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WorkflowVersionRepository extends JpaRepository<WorkflowVersion, UUID> {
    int countByDefinitionId(UUID definitionId);
}
