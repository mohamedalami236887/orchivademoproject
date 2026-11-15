package com.orchiva.workflow.workflow.repository;

import com.orchiva.workflow.identity.domain.RoleName;
import com.orchiva.workflow.workflow.domain.ApprovalTask;
import com.orchiva.workflow.workflow.domain.TaskStatus;
import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;

public interface ApprovalTaskRepository extends JpaRepository<ApprovalTask, UUID> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @EntityGraph(attributePaths = {"instance", "instance.request", "instance.request.department", "instance.request.creator", "instance.workflowVersion", "instance.workflowVersion.steps", "step"})
    Optional<ApprovalTask> findLockedById(UUID id);

    @EntityGraph(attributePaths = {"instance.request", "instance.request.creator", "step"})
    List<ApprovalTask> findAllByAssigneeRoleInAndStatusOrderByCreatedAtDesc(List<RoleName> roles, TaskStatus status);
    long countByAssigneeRoleInAndStatus(List<RoleName> roles, TaskStatus status);
}
