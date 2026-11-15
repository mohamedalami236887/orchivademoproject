package com.orchiva.workflow.audit.api;

import com.orchiva.workflow.audit.application.AuditQueryService;
import com.orchiva.workflow.audit.api.AuditModels.AuditResponse;
import com.orchiva.workflow.common.api.PageResponse;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;

@RestController @RequestMapping("/api/admin/audit-events")
@PreAuthorize("hasRole('ADMIN')")
public class AuditController {
    private final AuditQueryService events;
    public AuditController(AuditQueryService events) { this.events = events; }

    @GetMapping
    @Transactional(readOnly = true)
    PageResponse<AuditResponse> list(@RequestParam(defaultValue = "0") int page,
                                     @RequestParam(defaultValue = "25") int size,
                                     @RequestParam(defaultValue = "") String query,
                                     @RequestParam(defaultValue = "") String action) {
        return events.search(query, action, page, size);
    }
}
