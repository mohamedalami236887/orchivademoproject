package com.orchiva.workflow.workflow.repository;

import com.orchiva.workflow.workflow.domain.ApprovalDecision;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ApprovalDecisionRepository extends JpaRepository<ApprovalDecision, UUID> {
}
