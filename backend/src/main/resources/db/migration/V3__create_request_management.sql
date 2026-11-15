CREATE SEQUENCE request_reference_seq START WITH 1001;

CREATE TABLE request_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(40) NOT NULL UNIQUE,
    name VARCHAR(120) NOT NULL,
    description VARCHAR(500),
    active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference VARCHAR(30) NOT NULL UNIQUE,
    request_type_id UUID NOT NULL REFERENCES request_types(id),
    title VARCHAR(180) NOT NULL,
    description TEXT NOT NULL,
    creator_id UUID NOT NULL REFERENCES users(id),
    department_id UUID NOT NULL REFERENCES departments(id),
    status VARCHAR(30) NOT NULL,
    submitted_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ck_requests_status CHECK (status IN
        ('DRAFT', 'SUBMITTED', 'IN_REVIEW', 'CHANGES_REQUESTED', 'APPROVED', 'REJECTED', 'CANCELLED'))
);

CREATE INDEX idx_requests_creator ON requests(creator_id, created_at DESC);
CREATE INDEX idx_requests_department_status ON requests(department_id, status);
CREATE INDEX idx_requests_type ON requests(request_type_id);
CREATE INDEX idx_requests_updated ON requests(updated_at DESC);

INSERT INTO request_types(code, name, description) VALUES
    ('PURCHASE', 'Purchase authorization', 'Approval for planned goods or services purchases.'),
    ('EXPENSE', 'Expense reimbursement', 'Reimbursement of eligible business expenses.'),
    ('CONTRACT', 'Contract review', 'Legal and operational review of a proposed contract.'),
    ('ADMIN', 'Administrative request', 'General internal administrative request.');
