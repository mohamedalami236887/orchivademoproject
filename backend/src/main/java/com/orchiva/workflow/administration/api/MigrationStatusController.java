package com.orchiva.workflow.administration.api;

import java.time.Instant;
import java.util.List;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController @RequestMapping("/api/admin/migrations")
@PreAuthorize("hasRole('ADMIN')")
public class MigrationStatusController {
    private final JdbcTemplate jdbc;
    public MigrationStatusController(JdbcTemplate jdbc) { this.jdbc = jdbc; }
    @GetMapping
    List<MigrationStatus> list() {
        return jdbc.query("SELECT installed_rank, version, description, script, installed_on, success " +
                        "FROM flyway_schema_history ORDER BY installed_rank",
                (rs, row) -> new MigrationStatus(rs.getInt("installed_rank"), rs.getString("version"),
                        rs.getString("description"), rs.getString("script"),
                        rs.getTimestamp("installed_on").toInstant(), rs.getBoolean("success")));
    }
    public record MigrationStatus(int rank, String version, String description, String script,
                                  Instant installedOn, boolean success) {}
}
