package com.orchiva.workflow.identity.repository;

import com.orchiva.workflow.identity.domain.UserAccount;
import java.util.Optional;
import java.util.List;
import com.orchiva.workflow.identity.domain.RoleName;
import java.util.UUID;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserAccountRepository extends JpaRepository<UserAccount, UUID> {
    @EntityGraph(attributePaths = {"roles", "department"})
    Optional<UserAccount> findByUsernameIgnoreCase(String username);

    boolean existsByUsernameIgnoreCase(String username);
    boolean existsByEmailIgnoreCase(String email);
    List<UserAccount> findDistinctByRolesNameAndEnabledTrue(RoleName role);
}
