package com.orchiva.workflow.request.repository;

import com.orchiva.workflow.request.domain.BusinessRequest;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface BusinessRequestRepository extends JpaRepository<BusinessRequest, UUID>, JpaSpecificationExecutor<BusinessRequest> {
}
