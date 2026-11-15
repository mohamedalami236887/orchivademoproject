package com.orchiva.workflow.identity.repository;

import com.orchiva.workflow.identity.domain.Role;
import com.orchiva.workflow.identity.domain.RoleName;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RoleRepository extends JpaRepository<Role, Short> {
    Optional<Role> findByName(RoleName name);
}
