package com.orchiva.workflow.workflow.api;

import com.orchiva.workflow.workflow.api.WorkflowModels.DecisionRequest;
import com.orchiva.workflow.workflow.api.WorkflowModels.PublishWorkflowRequest;
import com.orchiva.workflow.workflow.api.WorkflowModels.TaskResponse;
import com.orchiva.workflow.workflow.api.WorkflowModels.WorkflowResponse;
import com.orchiva.workflow.workflow.application.WorkflowAdministrationService;
import com.orchiva.workflow.workflow.application.WorkflowService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
public class WorkflowController {
    private final WorkflowService workflows;
    private final WorkflowAdministrationService administration;
    public WorkflowController(WorkflowService workflows, WorkflowAdministrationService administration) {
        this.workflows = workflows; this.administration = administration;
    }

    @GetMapping("/api/approvals")
    @PreAuthorize("hasAnyRole('MANAGER','FINANCE','ADMIN')")
    List<TaskResponse> inbox() { return workflows.inbox(); }

    @PostMapping("/api/approvals/{id}/decisions")
    @PreAuthorize("hasAnyRole('MANAGER','FINANCE','ADMIN')")
    TaskResponse decide(@PathVariable UUID id, @Valid @RequestBody DecisionRequest request) {
        return workflows.decide(id, request);
    }

    @GetMapping("/api/workflows")
    @PreAuthorize("hasRole('ADMIN')")
    List<WorkflowResponse> list() { return administration.list(); }

    @PostMapping("/api/workflows/publish")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    WorkflowResponse publish(@Valid @RequestBody PublishWorkflowRequest request) {
        return administration.publish(request);
    }
}
