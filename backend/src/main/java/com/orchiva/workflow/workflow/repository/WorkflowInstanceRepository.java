package com.orchiva.workflow.workflow.repository;

import com.orchiva.workflow.workflow.domain.WorkflowInstance;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WorkflowInstanceRepository extends JpaRepository<WorkflowInstance, UUID> {
    Optional<WorkflowInstance> findByRequestId(UUID requestId);
}
