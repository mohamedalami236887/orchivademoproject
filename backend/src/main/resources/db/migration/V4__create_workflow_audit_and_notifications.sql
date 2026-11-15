CREATE TABLE workflow_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_type_id UUID NOT NULL UNIQUE REFERENCES request_types(id),
    name VARCHAR(160) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    current_version_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE workflow_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    definition_id UUID NOT NULL REFERENCES workflow_definitions(id),
    version_number INTEGER NOT NULL,
    published BOOLEAN NOT NULL DEFAULT FALSE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_workflow_version UNIQUE(definition_id, version_number),
    CONSTRAINT ck_workflow_version_number CHECK(version_number > 0)
);

ALTER TABLE workflow_definitions ADD CONSTRAINT fk_workflow_current_version
    FOREIGN KEY (current_version_id) REFERENCES workflow_versions(id);

CREATE TABLE workflow_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_version_id UUID NOT NULL REFERENCES workflow_versions(id) ON DELETE CASCADE,
    position INTEGER NOT NULL,
    name VARCHAR(140) NOT NULL,
    approver_role VARCHAR(30) NOT NULL,
    CONSTRAINT uq_workflow_step_position UNIQUE(workflow_version_id, position),
    CONSTRAINT ck_workflow_step_position CHECK(position > 0),
    CONSTRAINT ck_workflow_step_role CHECK(approver_role IN ('MANAGER', 'FINANCE', 'ADMIN'))
);

CREATE TABLE workflow_instances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL UNIQUE REFERENCES requests(id),
    workflow_version_id UUID NOT NULL REFERENCES workflow_versions(id),
    status VARCHAR(30) NOT NULL,
    current_step_position INTEGER NOT NULL,
    attempt INTEGER NOT NULL DEFAULT 1,
    version BIGINT NOT NULL DEFAULT 0,
    started_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMPTZ,
    CONSTRAINT ck_workflow_instance_status CHECK(status IN
        ('IN_PROGRESS', 'APPROVED', 'REJECTED', 'CHANGES_REQUESTED', 'CANCELLED'))
);

CREATE TABLE approval_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_instance_id UUID NOT NULL REFERENCES workflow_instances(id),
    workflow_step_id UUID NOT NULL REFERENCES workflow_steps(id),
    assignee_role VARCHAR(30) NOT NULL,
    attempt INTEGER NOT NULL,
    status VARCHAR(30) NOT NULL,
    decided_by UUID REFERENCES users(id),
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    decided_at TIMESTAMPTZ,
    CONSTRAINT ck_approval_task_status CHECK(status IN
        ('PENDING', 'APPROVED', 'REJECTED', 'CHANGES_REQUESTED', 'CANCELLED')),
    CONSTRAINT uq_approval_task_step_attempt UNIQUE(workflow_instance_id, workflow_step_id, attempt)
);

CREATE TABLE approval_decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    approval_task_id UUID NOT NULL UNIQUE REFERENCES approval_tasks(id),
    actor_id UUID NOT NULL REFERENCES users(id),
    decision VARCHAR(30) NOT NULL,
    comments VARCHAR(2000),
    decided_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ck_approval_decision CHECK(decision IN ('APPROVED', 'REJECTED', 'CHANGES_REQUESTED'))
);

CREATE TABLE audit_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actor_id UUID REFERENCES users(id),
    action VARCHAR(80) NOT NULL,
    target_type VARCHAR(80) NOT NULL,
    target_id VARCHAR(80),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id UUID NOT NULL REFERENCES users(id),
    type VARCHAR(60) NOT NULL,
    title VARCHAR(180) NOT NULL,
    message VARCHAR(1000) NOT NULL,
    target_url VARCHAR(300),
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_workflow_instances_status ON workflow_instances(status);
CREATE INDEX idx_approval_tasks_inbox ON approval_tasks(assignee_role, status, created_at DESC);
CREATE INDEX idx_audit_events_target ON audit_events(target_type, target_id, occurred_at DESC);
CREATE INDEX idx_audit_events_actor ON audit_events(actor_id, occurred_at DESC);
CREATE INDEX idx_notifications_recipient ON notifications(recipient_id, read_at, created_at DESC);

INSERT INTO workflow_definitions(id, request_type_id, name)
SELECT '30000000-0000-0000-0000-000000000001', id, 'Purchase authorization workflow'
FROM request_types WHERE code = 'PURCHASE';

INSERT INTO workflow_versions(id, definition_id, version_number, published, created_by)
VALUES ('31000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 1, TRUE,
        '20000000-0000-0000-0000-000000000004');

INSERT INTO workflow_steps(id, workflow_version_id, position, name, approver_role) VALUES
    ('32000000-0000-0000-0000-000000000001', '31000000-0000-0000-0000-000000000001', 1, 'Department manager review', 'MANAGER'),
    ('32000000-0000-0000-0000-000000000002', '31000000-0000-0000-0000-000000000001', 2, 'Finance validation', 'FINANCE');

UPDATE workflow_definitions SET current_version_id = '31000000-0000-0000-0000-000000000001'
WHERE id = '30000000-0000-0000-0000-000000000001';
