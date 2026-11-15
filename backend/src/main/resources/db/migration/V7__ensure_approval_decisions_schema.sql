-- Forward-only reconciliation for installations where the original V4 was
-- recorded before the approval decision persistence model was introduced.
-- Existing tables and rows are left untouched.
CREATE TABLE IF NOT EXISTS approval_decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    approval_task_id UUID NOT NULL UNIQUE REFERENCES approval_tasks(id),
    actor_id UUID NOT NULL REFERENCES users(id),
    decision VARCHAR(30) NOT NULL,
    comments VARCHAR(2000),
    decided_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ck_approval_decision CHECK(decision IN ('APPROVED', 'REJECTED', 'CHANGES_REQUESTED'))
);
