package com.orchiva.workflow.department.api;

import com.orchiva.workflow.common.error.ResourceNotFoundException;
import com.orchiva.workflow.department.domain.Department;
import com.orchiva.workflow.department.repository.DepartmentRepository;
import com.orchiva.workflow.identity.repository.UserAccountRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/departments")
public class DepartmentController {
    private final DepartmentRepository departments;
    private final UserAccountRepository users;

    public DepartmentController(DepartmentRepository departments, UserAccountRepository users) {
        this.departments = departments;
        this.users = users;
    }

    @GetMapping
    List<DepartmentResponse> list() {
        return departments.findAll().stream().map(DepartmentResponse::from).toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    DepartmentResponse create(@Valid @RequestBody DepartmentRequest request) {
        validateManager(request.managerId());
        Department department = new Department(request.code().trim().toUpperCase(), request.name().trim());
        department.update(request.code().trim().toUpperCase(), request.name().trim(), request.active(), request.managerId());
        return DepartmentResponse.from(departments.save(department));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    DepartmentResponse update(@PathVariable UUID id, @Valid @RequestBody DepartmentRequest request) {
        validateManager(request.managerId());
        Department department = departments.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Department not found."));
        department.update(request.code().trim().toUpperCase(), request.name().trim(), request.active(), request.managerId());
        return DepartmentResponse.from(department);
    }

    private void validateManager(UUID managerId) {
        if (managerId != null && !users.existsById(managerId)) {
            throw new ResourceNotFoundException("Manager not found.");
        }
    }

    public record DepartmentRequest(@NotBlank @Size(max = 30) String code,
                                    @NotBlank @Size(max = 120) String name,
                                    boolean active, UUID managerId) {}

    public record DepartmentResponse(UUID id, String code, String name, boolean active, UUID managerId) {
        static DepartmentResponse from(Department department) {
            return new DepartmentResponse(department.getId(), department.getCode(), department.getName(),
                    department.isActive(), department.getManagerId());
        }
    }
}
