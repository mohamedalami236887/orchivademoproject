-- Local portfolio demo records. These are real relational scenarios consumed by the application UI.
INSERT INTO requests(id, reference, request_type_id, title, description, creator_id, department_id, status, submitted_at, completed_at, created_at, updated_at)
SELECT '40000000-0000-0000-0000-000000000001', 'REQ-2026-000901', id,
       'Client workshop travel expenses',
       'Reimbursement draft for rail travel and accommodation associated with the November client workshop.',
       '20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'DRAFT', NULL, NULL,
       CURRENT_TIMESTAMP - INTERVAL '3 days', CURRENT_TIMESTAMP - INTERVAL '1 day'
FROM request_types WHERE code = 'EXPENSE';

INSERT INTO requests(id, reference, request_type_id, title, description, creator_id, department_id, status, submitted_at, created_at, updated_at)
SELECT '40000000-0000-0000-0000-000000000002', 'REQ-2026-000902', id,
       'Replace design team laptops',
       'Purchase six development laptops to replace devices that are outside the supported hardware lifecycle.',
       '20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'IN_REVIEW',
       CURRENT_TIMESTAMP - INTERVAL '20 hours', CURRENT_TIMESTAMP - INTERVAL '2 days', CURRENT_TIMESTAMP - INTERVAL '20 hours'
FROM request_types WHERE code = 'PURCHASE';

INSERT INTO requests(id, reference, request_type_id, title, description, creator_id, department_id, status, submitted_at, completed_at, created_at, updated_at)
SELECT '40000000-0000-0000-0000-000000000003', 'REQ-2026-000903', id,
       'Annual analytics subscription',
       'Renew the approved analytics platform subscription for the next financial year.',
       '20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'APPROVED',
       CURRENT_TIMESTAMP - INTERVAL '8 days', CURRENT_TIMESTAMP - INTERVAL '6 days',
       CURRENT_TIMESTAMP - INTERVAL '9 days', CURRENT_TIMESTAMP - INTERVAL '6 days'
FROM request_types WHERE code = 'PURCHASE';

INSERT INTO workflow_instances(id, request_id, workflow_version_id, status, current_step_position, attempt, started_at)
VALUES ('41000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000002',
        '31000000-0000-0000-0000-000000000001', 'IN_PROGRESS', 1, 1, CURRENT_TIMESTAMP - INTERVAL '20 hours');

INSERT INTO approval_tasks(id, workflow_instance_id, workflow_step_id, assignee_role, attempt, status, created_at)
VALUES ('42000000-0000-0000-0000-000000000001', '41000000-0000-0000-0000-000000000001',
        '32000000-0000-0000-0000-000000000001', 'MANAGER', 1, 'PENDING', CURRENT_TIMESTAMP - INTERVAL '20 hours');

INSERT INTO workflow_instances(id, request_id, workflow_version_id, status, current_step_position, attempt, started_at, completed_at)
VALUES ('41000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000003',
        '31000000-0000-0000-0000-000000000001', 'APPROVED', 2, 1,
        CURRENT_TIMESTAMP - INTERVAL '8 days', CURRENT_TIMESTAMP - INTERVAL '6 days');

INSERT INTO approval_tasks(id, workflow_instance_id, workflow_step_id, assignee_role, attempt, status, decided_by, created_at, decided_at) VALUES
    ('42000000-0000-0000-0000-000000000002', '41000000-0000-0000-0000-000000000002', '32000000-0000-0000-0000-000000000001', 'MANAGER', 1, 'APPROVED', '20000000-0000-0000-0000-000000000002', CURRENT_TIMESTAMP - INTERVAL '8 days', CURRENT_TIMESTAMP - INTERVAL '7 days'),
    ('42000000-0000-0000-0000-000000000003', '41000000-0000-0000-0000-000000000002', '32000000-0000-0000-0000-000000000002', 'FINANCE', 1, 'APPROVED', '20000000-0000-0000-0000-000000000003', CURRENT_TIMESTAMP - INTERVAL '7 days', CURRENT_TIMESTAMP - INTERVAL '6 days');

INSERT INTO approval_decisions(approval_task_id, actor_id, decision, comments, decided_at) VALUES
    ('42000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', 'APPROVED', 'Budget and operational need confirmed.', CURRENT_TIMESTAMP - INTERVAL '7 days'),
    ('42000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000003', 'APPROVED', 'Validated against the annual software budget.', CURRENT_TIMESTAMP - INTERVAL '6 days');

INSERT INTO notifications(recipient_id, type, title, message, target_url, read_at, created_at) VALUES
    ('20000000-0000-0000-0000-000000000002', 'APPROVAL_ASSIGNED', 'Purchase request awaiting review', 'REQ-2026-000902 requires your decision.', '/requests/40000000-0000-0000-0000-000000000002', NULL, CURRENT_TIMESTAMP - INTERVAL '20 hours'),
    ('20000000-0000-0000-0000-000000000001', 'REQUEST_APPROVED', 'Request approved', 'REQ-2026-000903 completed all approval steps.', '/requests/40000000-0000-0000-0000-000000000003', CURRENT_TIMESTAMP - INTERVAL '5 days', CURRENT_TIMESTAMP - INTERVAL '6 days');

INSERT INTO audit_events(actor_id, action, target_type, target_id, metadata, occurred_at) VALUES
    ('20000000-0000-0000-0000-000000000001', 'REQUEST_SUBMITTED', 'REQUEST', '40000000-0000-0000-0000-000000000003', '{"reference":"REQ-2026-000903"}', CURRENT_TIMESTAMP - INTERVAL '8 days'),
    ('20000000-0000-0000-0000-000000000002', 'APPROVAL_APPROVED', 'REQUEST', '40000000-0000-0000-0000-000000000003', '{"step":"Department manager review"}', CURRENT_TIMESTAMP - INTERVAL '7 days'),
    ('20000000-0000-0000-0000-000000000003', 'APPROVAL_APPROVED', 'REQUEST', '40000000-0000-0000-0000-000000000003', '{"step":"Finance validation"}', CURRENT_TIMESTAMP - INTERVAL '6 days');
