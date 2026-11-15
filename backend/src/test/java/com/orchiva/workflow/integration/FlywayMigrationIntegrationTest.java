package com.orchiva.workflow.integration;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("integration")
@EnabledIfEnvironmentVariable(named = "ORCHIVA_DB_PASSWORD", matches = ".+")
class FlywayMigrationIntegrationTest {
    @Autowired JdbcTemplate jdbc;

    @Test
    void appliesEveryMigrationAndCreatesTheNormalizedSchema() {
        List<String> versions = jdbc.queryForList(
                "SELECT version FROM flyway_schema_history WHERE success ORDER BY installed_rank", String.class);
        assertThat(versions).contains("1", "2", "3", "4", "5", "6", "7");
        Integer tables = jdbc.queryForObject("""
                SELECT count(*) FROM information_schema.tables
                WHERE table_schema = 'public' AND table_name IN
                ('users','departments','requests','workflow_instances','approval_tasks','approval_decisions',
                 'documents','document_versions','audit_events','notifications')
                """, Integer.class);
        assertThat(tables).isEqualTo(10);
        Integer purchaseSteps = jdbc.queryForObject("""
                SELECT count(*) FROM workflow_steps ws
                JOIN workflow_versions wv ON wv.id = ws.workflow_version_id
                WHERE wv.id = '31000000-0000-0000-0000-000000000001'
                """, Integer.class);
        assertThat(purchaseSteps).isEqualTo(2);
    }
}
