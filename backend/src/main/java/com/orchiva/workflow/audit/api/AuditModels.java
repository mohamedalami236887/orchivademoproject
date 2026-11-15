package com.orchiva.workflow.audit.api;

import java.time.Instant;
import java.util.UUID;

public final class AuditModels {
    private AuditModels() {}
    public record AuditResponse(UUID id, Instant occurredAt, String actor, String actorUsername,
                                String action, String targetType, String targetId,
                                UUID requestId, String requestReference, String metadata) {}
}
