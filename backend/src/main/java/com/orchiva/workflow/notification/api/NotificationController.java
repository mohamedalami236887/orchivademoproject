package com.orchiva.workflow.notification.api;

import com.orchiva.workflow.notification.application.NotificationService;
import com.orchiva.workflow.notification.application.NotificationService.NotificationList;
import com.orchiva.workflow.notification.application.NotificationService.NotificationResponse;
import java.util.UUID;
import org.springframework.web.bind.annotation.*;

@RestController @RequestMapping("/api/notifications")
public class NotificationController {
    private final NotificationService service;
    public NotificationController(NotificationService service) { this.service = service; }
    @GetMapping NotificationList list() { return service.list(); }
    @PostMapping("/{id}/read") NotificationResponse read(@PathVariable UUID id) { return service.markRead(id); }
    @PostMapping("/read-all") NotificationService.ReadAllResponse readAll() { return service.markAllRead(); }
}
