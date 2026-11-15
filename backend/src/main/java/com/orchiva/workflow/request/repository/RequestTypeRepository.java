package com.orchiva.workflow.request.repository;

import com.orchiva.workflow.request.domain.RequestType;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RequestTypeRepository extends JpaRepository<RequestType, UUID> {
    Optional<RequestType> findByIdAndActiveTrue(UUID id);
    List<RequestType> findAllByActiveTrueOrderByName();
}
