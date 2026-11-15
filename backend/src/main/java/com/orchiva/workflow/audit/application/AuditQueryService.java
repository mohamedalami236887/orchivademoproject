package com.orchiva.workflow.audit.application;

import com.orchiva.workflow.audit.api.AuditModels.AuditResponse;
import com.orchiva.workflow.common.api.PageResponse;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class AuditQueryService {
    private static final String FROM_AND_FILTER = """
            FROM audit_events event
            LEFT JOIN users actor ON actor.id = event.actor_id
            LEFT JOIN requests request_record
              ON event.target_type = 'REQUEST' AND event.target_id = request_record.id::text
            LEFT JOIN documents document_record
              ON event.target_type = 'DOCUMENT' AND event.target_id = document_record.id::text
            LEFT JOIN requests document_request ON document_request.id = document_record.request_id
            WHERE (? = '' OR lower(event.action) LIKE ? OR lower(event.target_type) LIKE ?
                   OR lower(COALESCE(actor.username, 'system')) LIKE ?
                   OR lower(COALESCE(actor.first_name || ' ' || actor.last_name, 'system')) LIKE ?
                   OR lower(COALESCE(request_record.reference, document_request.reference, '')) LIKE ?
                   OR lower(event.metadata::text) LIKE ?)
              AND (? = '' OR event.action = ?)
            """;
    private final JdbcTemplate jdbc;
    public AuditQueryService(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    public PageResponse<AuditResponse> search(String query, String action, int page, int size) {
        int safePage = Math.max(0, page);
        int safeSize = Math.min(100, Math.max(1, size));
        String term = query == null ? "" : query.trim().toLowerCase(Locale.ROOT);
        String like = "%" + term + "%";
        String safeAction = action == null ? "" : action.trim().toUpperCase(Locale.ROOT);
        Object[] filters = {term, like, like, like, like, like, like, safeAction, safeAction};
        long total = jdbc.queryForObject("SELECT count(*) " + FROM_AND_FILTER, Long.class, filters);
        Object[] pageArgs = java.util.Arrays.copyOf(filters, filters.length + 2);
        pageArgs[filters.length] = safeSize;
        pageArgs[filters.length + 1] = safePage * safeSize;
        List<AuditResponse> content = jdbc.query("""
                SELECT event.id, event.occurred_at, event.action, event.target_type, event.target_id,
                       event.metadata::text,
                       COALESCE(trim(actor.first_name || ' ' || actor.last_name), 'System') AS actor,
                       COALESCE(actor.username, 'system') AS actor_username,
                       COALESCE(request_record.id, document_request.id) AS request_id,
                       COALESCE(request_record.reference, document_request.reference) AS request_reference
                """ + FROM_AND_FILTER + " ORDER BY event.occurred_at DESC LIMIT ? OFFSET ?",
                (result, row) -> map(result), pageArgs);
        int totalPages = total == 0 ? 0 : (int) Math.ceil((double) total / safeSize);
        return new PageResponse<>(content, safePage, safeSize, total, totalPages);
    }

    private static AuditResponse map(ResultSet result) throws SQLException {
        return new AuditResponse(result.getObject("id", UUID.class), instant(result, "occurred_at"),
                result.getString("actor"), result.getString("actor_username"), result.getString("action"),
                result.getString("target_type"), result.getString("target_id"),
                result.getObject("request_id", UUID.class), result.getString("request_reference"),
                result.getString("metadata"));
    }
    private static Instant instant(ResultSet result, String column) throws SQLException {
        var value = result.getTimestamp(column); return value == null ? null : value.toInstant();
    }
}
