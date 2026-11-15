package com.orchiva.workflow.notification.application;

import com.orchiva.workflow.common.error.ResourceNotFoundException;
import com.orchiva.workflow.identity.application.CurrentUserService;
import com.orchiva.workflow.notification.domain.Notification;
import com.orchiva.workflow.notification.repository.NotificationRepository;
import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class NotificationService {
    private final NotificationRepository notifications;
    private final CurrentUserService currentUsers;
    private final Clock clock;
    public NotificationService(NotificationRepository notifications, CurrentUserService currentUsers, Clock clock) {
        this.notifications = notifications; this.currentUsers = currentUsers; this.clock = clock;
    }
    @Transactional(readOnly = true)
    public NotificationList list() {
        UUID userId = currentUsers.id();
        List<NotificationResponse> items = notifications.findAllByRecipientIdOrderByCreatedAtDesc(userId).stream()
                .map(NotificationResponse::from).toList();
        return new NotificationList(notifications.countByRecipientIdAndReadAtIsNull(userId), items);
    }
    public NotificationResponse markRead(UUID id) {
        Notification notification = notifications.findByIdAndRecipientId(id, currentUsers.id())
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found."));
        notification.markRead(Instant.now(clock));
        return NotificationResponse.from(notification);
    }
    public ReadAllResponse markAllRead() {
        Instant readAt = Instant.now(clock);
        long updated = 0;
        for (Notification notification : notifications.findAllByRecipientIdOrderByCreatedAtDesc(currentUsers.id())) {
            if (notification.getReadAt() == null) {
                notification.markRead(readAt);
                updated++;
            }
        }
        return new ReadAllResponse(updated);
    }
    public record NotificationList(long unread, List<NotificationResponse> items) {}
    public record ReadAllResponse(long updated) {}
    public record NotificationResponse(UUID id, String type, String title, String message,
                                       String targetUrl, Instant readAt, Instant createdAt) {
        static NotificationResponse from(Notification value) {
            return new NotificationResponse(value.getId(), value.getType(), value.getTitle(), value.getMessage(),
                    value.getTargetUrl(), value.getReadAt(), value.getCreatedAt());
        }
    }
}
