package com.orchiva.workflow.request.application;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.orchiva.workflow.audit.application.AuditService;
import com.orchiva.workflow.department.domain.Department;
import com.orchiva.workflow.identity.application.CurrentUserService;
import com.orchiva.workflow.identity.domain.Role;
import com.orchiva.workflow.identity.domain.RoleName;
import com.orchiva.workflow.identity.domain.UserAccount;
import com.orchiva.workflow.request.domain.BusinessRequest;
import com.orchiva.workflow.request.domain.RequestType;
import com.orchiva.workflow.request.repository.BusinessRequestRepository;
import com.orchiva.workflow.request.repository.RequestTypeRepository;
import com.orchiva.workflow.workflow.application.WorkflowService;
import java.time.Clock;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.AccessDeniedException;

class RequestAuthorizationTest {
    private final RequestService service = new RequestService(mock(BusinessRequestRepository.class),
            mock(RequestTypeRepository.class), mock(CurrentUserService.class), mock(JdbcTemplate.class),
            Clock.systemUTC(), mock(WorkflowService.class), mock(AuditService.class));

    @Test
    void deniesEmployeeAccessToAnotherEmployeesRequest() {
        Department department = department(UUID.randomUUID());
        UserAccount owner = user(UUID.randomUUID(), department, RoleName.EMPLOYEE);
        UserAccount stranger = user(UUID.randomUUID(), department, RoleName.EMPLOYEE);
        BusinessRequest request = new BusinessRequest("REQ-1", mock(RequestType.class), "Restricted", "Details", owner, department);
        assertThatThrownBy(() -> service.requireView(request, stranger)).isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void allowsDepartmentManagerWithinScopeAndAdministratorAcrossScope() {
        Department department = department(UUID.randomUUID());
        UserAccount owner = user(UUID.randomUUID(), department, RoleName.EMPLOYEE);
        BusinessRequest request = new BusinessRequest("REQ-2", mock(RequestType.class), "Scoped", "Details", owner, department);
        assertThatCode(() -> service.requireView(request, user(UUID.randomUUID(), department, RoleName.MANAGER))).doesNotThrowAnyException();
        assertThatCode(() -> service.requireView(request, user(UUID.randomUUID(), department(UUID.randomUUID()), RoleName.ADMIN))).doesNotThrowAnyException();
    }

    private UserAccount user(UUID id, Department department, RoleName roleName) {
        Role role = mock(Role.class); when(role.getName()).thenReturn(roleName);
        UserAccount user = mock(UserAccount.class); when(user.getId()).thenReturn(id);
        when(user.getDepartment()).thenReturn(department); when(user.getRoles()).thenReturn(Set.of(role));
        return user;
    }
    private Department department(UUID id) { Department value=mock(Department.class);when(value.getId()).thenReturn(id);return value; }
}
