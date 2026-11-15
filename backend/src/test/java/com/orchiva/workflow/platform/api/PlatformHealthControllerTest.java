package com.orchiva.workflow.platform.api;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;

class PlatformHealthControllerTest {

    private static final Instant NOW = Instant.parse("2026-01-01T12:00:00Z");

    @Test
    void reportsAStableHealthyResponse() {
        var controller = new PlatformHealthController(
                Clock.fixed(NOW, ZoneOffset.UTC),
                Optional.empty());

        var response = controller.health();

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().product()).isEqualTo("Orchiva");
        assertThat(response.getBody().status()).isEqualTo("UP");
        assertThat(response.getBody().version()).isEqualTo("development");
        assertThat(response.getBody().timestamp()).isEqualTo(NOW);
    }
}
