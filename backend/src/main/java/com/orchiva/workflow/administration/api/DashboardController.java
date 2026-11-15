package com.orchiva.workflow.administration.api;

import com.orchiva.workflow.administration.application.DashboardService;
import com.orchiva.workflow.administration.application.DashboardService.DashboardResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController @RequestMapping("/api/dashboard")
public class DashboardController {
    private final DashboardService service;
    public DashboardController(DashboardService service) { this.service = service; }
    @GetMapping DashboardResponse dashboard() { return service.dashboard(); }
}
