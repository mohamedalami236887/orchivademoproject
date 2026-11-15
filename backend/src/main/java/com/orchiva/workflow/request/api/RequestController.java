package com.orchiva.workflow.request.api;

import com.orchiva.workflow.common.api.PageResponse;
import com.orchiva.workflow.request.api.RequestModels.RequestResponse;
import com.orchiva.workflow.request.api.RequestModels.RequestTypeResponse;
import com.orchiva.workflow.request.api.RequestModels.SaveRequest;
import com.orchiva.workflow.request.application.RequestService;
import com.orchiva.workflow.request.application.RequestWorkspaceService;
import com.orchiva.workflow.request.domain.RequestStatus;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/requests")
@Validated
public class RequestController {
    private final RequestService service;
    private final RequestWorkspaceService workspaces;

    public RequestController(RequestService service, RequestWorkspaceService workspaces) {
        this.service = service;
        this.workspaces = workspaces;
    }

    @GetMapping("/types")
    List<RequestTypeResponse> types() { return service.listTypes(); }

    @GetMapping
    PageResponse<RequestResponse> search(@RequestParam(required = false) String query,
                                         @RequestParam(required = false) RequestStatus status,
                                         @RequestParam(required = false) UUID typeId,
                                         @RequestParam(defaultValue = "0") @Min(0) int page,
                                         @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size,
                                         @RequestParam(defaultValue = "updatedAt") String sortBy,
                                         @RequestParam(defaultValue = "DESC") org.springframework.data.domain.Sort.Direction direction) {
        return service.search(query, status, typeId, page, size, sortBy, direction);
    }

    @GetMapping("/{id}")
    RequestResponse get(@PathVariable UUID id) { return service.get(id); }

    @GetMapping("/{id}/workspace")
    RequestWorkspaceModels.RequestWorkspaceResponse workspace(@PathVariable UUID id) {
        return workspaces.get(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    RequestResponse create(@Valid @RequestBody SaveRequest request) { return service.createDraft(request); }

    @PutMapping("/{id}")
    RequestResponse update(@PathVariable UUID id, @Valid @RequestBody SaveRequest request) {
        return service.update(id, request);
    }

    @PostMapping("/{id}/submit")
    RequestResponse submit(@PathVariable UUID id) { return service.submit(id); }

    @PostMapping("/{id}/cancel")
    RequestResponse cancel(@PathVariable UUID id) { return service.cancel(id); }
}
