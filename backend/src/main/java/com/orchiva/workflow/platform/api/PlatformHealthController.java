package com.orchiva.workflow.platform.api;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.time.Clock;
import java.time.Instant;
import org.springframework.boot.info.BuildProperties;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/health")
@Tag(name = "Platform")
public class PlatformHealthController {

    private static final String PRODUCT = "Orchiva";
    private final Clock clock;
    private final String version;

    public PlatformHealthController(Clock clock, java.util.Optional<BuildProperties> buildProperties) {
        this.clock = clock;
        this.version = buildProperties.map(BuildProperties::getVersion).orElse("development");
    }

    @GetMapping
    @Operation(summary = "Checks whether the Orchiva API is available")
    public ResponseEntity<PlatformHealthResponse> health() {
        return ResponseEntity.ok(new PlatformHealthResponse(PRODUCT, "UP", version, Instant.now(clock)));
    }

    public record PlatformHealthResponse(String product, String status, String version, Instant timestamp) {
    }
}
