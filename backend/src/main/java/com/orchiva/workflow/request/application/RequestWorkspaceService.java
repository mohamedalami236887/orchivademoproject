package com.orchiva.workflow.request.application;

import com.orchiva.workflow.request.api.RequestModels.RequestResponse;
import com.orchiva.workflow.request.api.RequestWorkspaceModels.ActivityItem;
import com.orchiva.workflow.request.api.RequestWorkspaceModels.ApprovalHistoryItem;
import com.orchiva.workflow.request.api.RequestWorkspaceModels.RequestWorkspaceResponse;
import com.orchiva.workflow.request.api.RequestWorkspaceModels.WorkflowStepProgress;
import com.orchiva.workflow.request.api.RequestWorkspaceModels.WorkflowSummary;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class RequestWorkspaceService {
    private final RequestService requests;
    private final JdbcTemplate jdbc;

    public RequestWorkspaceService(RequestService requests, JdbcTemplate jdbc) {
        this.requests = requests;
        this.jdbc = jdbc;
    }

    public RequestWorkspaceResponse get(UUID requestId) {
        RequestResponse request = requests.get(requestId);
        return new RequestWorkspaceResponse(request, workflow(requestId), steps(requestId),
                approvals(requestId), activity(requestId));
    }

    private WorkflowSummary workflow(UUID requestId) {
        return jdbc.query("""
                SELECT wd.name, wv.version_number, wi.status, wi.current_step_position,
                       wi.attempt, wi.started_at, wi.completed_at
                FROM workflow_instances wi
                JOIN workflow_versions wv ON wv.id = wi.workflow_version_id
                JOIN workflow_definitions wd ON wd.id = wv.definition_id
                WHERE wi.request_id = ?
                """, result -> result.next() ? new WorkflowSummary(result.getString("name"),
                result.getInt("version_number"), result.getString("status"),
                result.getInt("current_step_position"), result.getInt("attempt"),
                instant(result, "started_at"), instant(result, "completed_at")) : null, requestId);
    }

    private List<WorkflowStepProgress> steps(UUID requestId) {
        return jdbc.query("""
                SELECT ws.position, ws.name, ws.approver_role,
                       latest.status, COALESCE(latest.attempt, wi.attempt) AS attempt,
                       latest.created_at, latest.decided_at,
                       trim(concat(u.first_name, ' ', u.last_name)) AS actor,
                       decision.comments
                FROM workflow_instances wi
                JOIN workflow_steps ws ON ws.workflow_version_id = wi.workflow_version_id
                LEFT JOIN LATERAL (
                    SELECT task.* FROM approval_tasks task
                    WHERE task.workflow_instance_id = wi.id AND task.workflow_step_id = ws.id
                    ORDER BY task.attempt DESC, task.created_at DESC LIMIT 1
                ) latest ON TRUE
                LEFT JOIN users u ON u.id = latest.decided_by
                LEFT JOIN approval_decisions decision ON decision.approval_task_id = latest.id
                WHERE wi.request_id = ?
                ORDER BY ws.position
                """, (result, row) -> new WorkflowStepProgress(result.getInt("position"),
                result.getString("name"), result.getString("approver_role"),
                result.getString("status") == null ? "NOT_STARTED" : result.getString("status"),
                result.getInt("attempt"), blankToNull(result.getString("actor")),
                instant(result, "created_at"), instant(result, "decided_at"),
                result.getString("comments")), requestId);
    }

    private List<ApprovalHistoryItem> approvals(UUID requestId) {
        return jdbc.query("""
                SELECT decision.id, task.attempt, step.position, step.name,
                       trim(concat(actor.first_name, ' ', actor.last_name)) AS actor,
                       decision.decision, decision.comments, decision.decided_at
                FROM approval_decisions decision
                JOIN approval_tasks task ON task.id = decision.approval_task_id
                JOIN workflow_instances instance ON instance.id = task.workflow_instance_id
                JOIN workflow_steps step ON step.id = task.workflow_step_id
                JOIN users actor ON actor.id = decision.actor_id
                WHERE instance.request_id = ?
                ORDER BY decision.decided_at DESC
                """, (result, row) -> new ApprovalHistoryItem(result.getObject("id", UUID.class),
                result.getInt("attempt"), result.getInt("position"), result.getString("name"),
                result.getString("actor"), result.getString("decision"),
                result.getString("comments"), instant(result, "decided_at")), requestId);
    }

    private List<ActivityItem> activity(UUID requestId) {
        return jdbc.query("""
                SELECT event.id, event.action, event.occurred_at, event.target_type,
                       event.target_id, event.metadata::text,
                       COALESCE(trim(concat(actor.first_name, ' ', actor.last_name)), 'System') AS actor
                FROM audit_events event
                LEFT JOIN users actor ON actor.id = event.actor_id
                WHERE (event.target_type = 'REQUEST' AND event.target_id = ?::text)
                   OR (event.target_type = 'DOCUMENT' AND EXISTS (
                       SELECT 1 FROM documents document
                       WHERE document.request_id = ? AND document.id::text = event.target_id))
                ORDER BY event.occurred_at DESC
                LIMIT 100
                """, (result, row) -> new ActivityItem(result.getObject("id", UUID.class),
                result.getString("action"), result.getString("actor"), instant(result, "occurred_at"),
                result.getString("target_type"), result.getString("target_id"),
                result.getString("metadata")), requestId, requestId);
    }

    private static Instant instant(ResultSet result, String column) throws SQLException {
        var value = result.getTimestamp(column);
        return value == null ? null : value.toInstant();
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value;
    }
}
