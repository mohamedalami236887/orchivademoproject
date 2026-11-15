package com.orchiva.workflow.identity.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.orchiva.workflow.common.error.BusinessRuleException;
import com.orchiva.workflow.identity.api.UserModels.CreateUserRequest;
import com.orchiva.workflow.identity.domain.Role;
import com.orchiva.workflow.identity.domain.RoleName;
import com.orchiva.workflow.identity.domain.UserAccount;
import com.orchiva.workflow.identity.repository.RoleRepository;
import com.orchiva.workflow.identity.repository.UserAccountRepository;
import com.orchiva.workflow.department.repository.DepartmentRepository;
import java.util.Optional;
import java.util.Set;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

@ExtendWith(MockitoExtension.class)
class UserAdministrationServiceTest {
    @Mock UserAccountRepository users;
    @Mock RoleRepository roles;
    @Mock DepartmentRepository departments;
    @Mock Role employeeRole;

    private UserAdministrationService service;

    @BeforeEach
    void setUp() {
        service = new UserAdministrationService(users, roles, departments, new BCryptPasswordEncoder(4));
    }

    @Test
    void createsUserWithHashedPasswordAndResolvedRole() {
        when(users.existsByUsernameIgnoreCase("new.employee")).thenReturn(false);
        when(users.existsByEmailIgnoreCase("new@orchiva.local")).thenReturn(false);
        when(roles.findByName(RoleName.EMPLOYEE)).thenReturn(Optional.of(employeeRole));
        when(employeeRole.getName()).thenReturn(RoleName.EMPLOYEE);
        when(users.save(any(UserAccount.class))).thenAnswer(invocation -> invocation.getArgument(0));

        service.create(new CreateUserRequest("new.employee", "new@orchiva.local", "StrongPass!2026",
                "New", "Employee", null, Set.of(RoleName.EMPLOYEE)));

        var captor = org.mockito.ArgumentCaptor.forClass(UserAccount.class);
        verify(users).save(captor.capture());
        assertThat(captor.getValue().getPasswordHash()).doesNotContain("StrongPass!2026");
        assertThat(new BCryptPasswordEncoder().matches("StrongPass!2026", captor.getValue().getPasswordHash()))
                .isTrue();
    }

    @Test
    void rejectsDuplicateIdentity() {
        when(users.existsByUsernameIgnoreCase("employee")).thenReturn(true);

        assertThatThrownBy(() -> service.create(new CreateUserRequest("employee", "other@orchiva.local",
                "StrongPass!2026", "Other", "Person", null, Set.of(RoleName.EMPLOYEE))))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("unique");
    }

    @Test
    void migrationDemoPasswordIsARealBcryptHash() {
        String migrationHash = "$2a$12$yAaKvCzavNhkRxSJ35d7JeykQvCZONr.5Jf5ZY/fGY0l7N4IxezDK";
        assertThat(new BCryptPasswordEncoder().matches("password", migrationHash)).isTrue();
    }
}
