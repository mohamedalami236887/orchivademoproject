package com.orchiva.workflow.identity.api;

import com.orchiva.workflow.identity.domain.RoleName;
import com.orchiva.workflow.identity.domain.UserAccount;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import java.util.Set;
import java.util.UUID;

public final class UserModels {
    private UserModels() {}

    public record CreateUserRequest(
            @NotBlank @Size(max = 80) String username,
            @NotBlank @Email @Size(max = 254) String email,
            @NotBlank @Size(min = 12, max = 72) String password,
            @NotBlank @Size(max = 80) String firstName,
            @NotBlank @Size(max = 80) String lastName,
            UUID departmentId,
            @NotEmpty Set<RoleName> roles) {}

    public record UpdateUserRequest(
            @NotBlank @Email @Size(max = 254) String email,
            @NotBlank @Size(max = 80) String firstName,
            @NotBlank @Size(max = 80) String lastName,
            UUID departmentId,
            boolean enabled,
            @NotEmpty Set<RoleName> roles) {}

    public record UserResponse(UUID id, String username, String email, String firstName, String lastName,
                               boolean enabled, UUID departmentId, String departmentName,
                               Set<RoleName> roles) {
        public static UserResponse from(UserAccount user) {
            return new UserResponse(user.getId(), user.getUsername(), user.getEmail(), user.getFirstName(),
                    user.getLastName(), user.isEnabled(),
                    user.getDepartment() == null ? null : user.getDepartment().getId(),
                    user.getDepartment() == null ? null : user.getDepartment().getName(),
                    user.getRoles().stream().map(role -> role.getName()).collect(java.util.stream.Collectors.toSet()));
        }
    }
}
