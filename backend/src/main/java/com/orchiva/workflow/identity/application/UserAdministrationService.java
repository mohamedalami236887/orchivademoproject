package com.orchiva.workflow.identity.application;

import com.orchiva.workflow.common.error.BusinessRuleException;
import com.orchiva.workflow.common.error.ResourceNotFoundException;
import com.orchiva.workflow.department.domain.Department;
import com.orchiva.workflow.department.repository.DepartmentRepository;
import com.orchiva.workflow.identity.api.UserModels.CreateUserRequest;
import com.orchiva.workflow.identity.api.UserModels.UpdateUserRequest;
import com.orchiva.workflow.identity.api.UserModels.UserResponse;
import com.orchiva.workflow.identity.domain.Role;
import com.orchiva.workflow.identity.domain.RoleName;
import com.orchiva.workflow.identity.domain.UserAccount;
import com.orchiva.workflow.identity.repository.RoleRepository;
import com.orchiva.workflow.identity.repository.UserAccountRepository;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class UserAdministrationService {
    private final UserAccountRepository users;
    private final RoleRepository roles;
    private final DepartmentRepository departments;
    private final PasswordEncoder passwordEncoder;

    public UserAdministrationService(UserAccountRepository users, RoleRepository roles,
                                     DepartmentRepository departments, PasswordEncoder passwordEncoder) {
        this.users = users;
        this.roles = roles;
        this.departments = departments;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public List<UserResponse> list() {
        return users.findAll().stream().map(UserResponse::from).toList();
    }

    public UserResponse create(CreateUserRequest request) {
        if (users.existsByUsernameIgnoreCase(request.username()) || users.existsByEmailIgnoreCase(request.email())) {
            throw new BusinessRuleException("Username and email must be unique.");
        }
        UserAccount user = new UserAccount(request.username().trim(), request.email().trim().toLowerCase(),
                passwordEncoder.encode(request.password()), request.firstName().trim(), request.lastName().trim(),
                department(request.departmentId()), resolveRoles(request.roles()));
        return UserResponse.from(users.save(user));
    }

    public UserResponse update(UUID id, UpdateUserRequest request) {
        UserAccount user = users.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));
        user.update(request.email().trim().toLowerCase(), request.firstName().trim(), request.lastName().trim(),
                department(request.departmentId()), request.enabled(), resolveRoles(request.roles()));
        return UserResponse.from(user);
    }

    private Department department(UUID id) {
        if (id == null) return null;
        return departments.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Department not found."));
    }

    private Set<Role> resolveRoles(Set<RoleName> names) {
        return names.stream().map(name -> roles.findByName(name)
                .orElseThrow(() -> new ResourceNotFoundException("Role not found: " + name)))
                .collect(Collectors.toSet());
    }
}
