package com.orchiva.workflow.notification.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.orchiva.workflow.identity.application.CurrentUserService;
import com.orchiva.workflow.notification.domain.Notification;
import com.orchiva.workflow.notification.repository.NotificationRepository;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {
    @Mock NotificationRepository notifications;
    @Mock CurrentUserService currentUsers;
    @Mock Notification unread;
    @Mock Notification alreadyRead;

    private final UUID userId = UUID.randomUUID();
    private final Instant now = Instant.parse("2026-11-13T08:00:00Z");
    private NotificationService service;

    @BeforeEach
    void setUp() {
        service = new NotificationService(notifications, currentUsers,
                Clock.fixed(now, ZoneOffset.UTC));
    }

    @Test
    void marksOnlyCurrentRecipientsUnreadNotifications() {
        when(currentUsers.id()).thenReturn(userId);
        when(notifications.findAllByRecipientIdOrderByCreatedAtDesc(userId))
                .thenReturn(List.of(unread, alreadyRead));
        when(unread.getReadAt()).thenReturn(null);
        when(alreadyRead.getReadAt()).thenReturn(now.minusSeconds(60));

        var result = service.markAllRead();

        assertThat(result.updated()).isEqualTo(1);
        verify(unread).markRead(now);
    }
}
