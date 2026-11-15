package com.orchiva.workflow.administration.application;

import com.orchiva.workflow.identity.application.CurrentUserService;
import com.orchiva.workflow.identity.domain.RoleName;
import com.orchiva.workflow.identity.domain.UserAccount;
import com.orchiva.workflow.notification.repository.NotificationRepository;
import com.orchiva.workflow.request.api.RequestModels.RequestResponse;
import com.orchiva.workflow.request.application.RequestService;
import com.orchiva.workflow.workflow.api.WorkflowModels.TaskResponse;
import com.orchiva.workflow.workflow.application.WorkflowService;
import java.util.List;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class DashboardService {
    private final JdbcTemplate jdbc;
    private final CurrentUserService currentUsers;
    private final NotificationRepository notifications;
    private final RequestService requests;
    private final WorkflowService workflows;
    public DashboardService(JdbcTemplate jdbc, CurrentUserService currentUsers,
                            NotificationRepository notifications, RequestService requests, WorkflowService workflows) {
        this.jdbc = jdbc; this.currentUsers = currentUsers;
        this.notifications = notifications; this.requests = requests; this.workflows = workflows;
    }

    public DashboardResponse dashboard() {
        UserAccount user = currentUsers.requireCurrentUser();
        String scope = " WHERE creator_id = ?";
        Object[] args = {user.getId()};
        if (has(user, RoleName.ADMIN) || has(user, RoleName.FINANCE)) { scope = ""; args = new Object[0]; }
        else if (has(user, RoleName.MANAGER) && user.getDepartment() != null) {
            scope = " WHERE department_id = ?"; args = new Object[]{user.getDepartment().getId()};
        }
        final Object[] scopeArgs = args;
        long total = count("SELECT count(*) FROM requests" + scope, args);
        String statusPrefix = scope.isEmpty() ? " WHERE" : scope + " AND";
        long active = count("SELECT count(*) FROM requests" + statusPrefix + " status IN ('SUBMITTED','IN_REVIEW','CHANGES_REQUESTED')", args);
        long approved = count("SELECT count(*) FROM requests" + statusPrefix + " status = 'APPROVED'", args);
        List<TaskResponse> inbox = user.getRoles().stream().anyMatch(role -> role.getName() != RoleName.EMPLOYEE)
                ? workflows.inbox() : List.of();
        long pendingApprovals = inbox.size();
        long unread = notifications.countByRecipientIdAndReadAtIsNull(user.getId());
        List<RequestResponse> recent = requests.search(null, null, null, 0, 5).content();
        List<StatusMetric> statusBreakdown = java.util.Arrays.stream(com.orchiva.workflow.request.domain.RequestStatus.values())
                .map(status -> new StatusMetric(status.name(), count("SELECT count(*) FROM requests" + statusPrefix + " status = '" + status.name() + "'", scopeArgs)))
                .toList();
        return new DashboardResponse(total, active, approved, pendingApprovals, unread, recent,
                statusBreakdown, inbox.stream().limit(4).toList());
    }

    private long count(String sql, Object[] args) { return jdbc.queryForObject(sql, Long.class, args); }
    private boolean has(UserAccount user, RoleName role) { return user.getRoles().stream().anyMatch(value -> value.getName() == role); }
    public record StatusMetric(String status, long count) {}
    public record DashboardResponse(long totalRequests, long activeRequests, long approvedRequests,
                                    long pendingApprovals, long unreadNotifications,
                                    List<RequestResponse> recentRequests,
                                    List<StatusMetric> statusBreakdown,
                                    List<TaskResponse> pendingPreview) {}
}
