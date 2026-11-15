
package com.orchiva.workflow.audit.application;

import tools.jackson.core.JacksonException;
import tools.jackson.databind.json.JsonMapper;

import com.orchiva.workflow.audit.domain.AuditEvent;
import com.orchiva.workflow.audit.repository.AuditEventRepository;
import com.orchiva.workflow.identity.domain.UserAccount;

import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class AuditService {

    private final AuditEventRepository events;
    private final JsonMapper mapper;

    public AuditService(AuditEventRepository events, JsonMapper mapper) {
        this.events = events;
        this.mapper = mapper;
    }

    public void record(
            UserAccount actor,
            String action,
            String targetType,
            Object targetId,
            Map<String, ?> metadata) {

        try {
            events.save(new AuditEvent(
                    actor,
                    action,
                    targetType,
                    targetId == null ? null : targetId.toString(),
                    mapper.writeValueAsString(metadata)
            ));
        } catch (JacksonException exception) {
            throw new IllegalArgumentException(
                    "Audit metadata is not serializable.",
                    exception
            );
        }
    }
}
