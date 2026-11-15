package com.orchiva.workflow.audit.repository;

import com.orchiva.workflow.audit.domain.AuditEvent;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AuditEventRepository extends JpaRepository<AuditEvent, UUID> {
    Page<AuditEvent> findAllByTargetTypeAndTargetId(String targetType, String targetId, Pageable pageable);
}
