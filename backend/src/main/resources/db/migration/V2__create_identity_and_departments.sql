CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(30) NOT NULL UNIQUE,
    name VARCHAR(120) NOT NULL UNIQUE,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    manager_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(80) NOT NULL UNIQUE,
    email VARCHAR(254) NOT NULL UNIQUE,
    password_hash VARCHAR(100) NOT NULL,
    first_name VARCHAR(80) NOT NULL,
    last_name VARCHAR(80) NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    account_non_locked BOOLEAN NOT NULL DEFAULT TRUE,
    department_id UUID REFERENCES departments(id),
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE roles (
    id SMALLSERIAL PRIMARY KEY,
    name VARCHAR(30) NOT NULL UNIQUE,
    CONSTRAINT ck_roles_name CHECK (name IN ('EMPLOYEE', 'MANAGER', 'FINANCE', 'ADMIN'))
);

CREATE TABLE user_roles (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id SMALLINT NOT NULL REFERENCES roles(id),
    PRIMARY KEY (user_id, role_id)
);

ALTER TABLE departments
    ADD CONSTRAINT fk_departments_manager FOREIGN KEY (manager_id) REFERENCES users(id);

CREATE INDEX idx_users_department ON users(department_id);
CREATE INDEX idx_departments_manager ON departments(manager_id);

INSERT INTO roles(name) VALUES ('EMPLOYEE'), ('MANAGER'), ('FINANCE'), ('ADMIN');
INSERT INTO departments(id, code, name) VALUES
    ('10000000-0000-0000-0000-000000000001', 'OPS', 'Operations'),
    ('10000000-0000-0000-0000-000000000002', 'FIN', 'Finance'),
    ('10000000-0000-0000-0000-000000000003', 'IT', 'Information Technology');

-- Development-only accounts. The shared initial password is "password" and must never be reused outside local demo use.
INSERT INTO users(id, username, email, password_hash, first_name, last_name, department_id) VALUES
    ('20000000-0000-0000-0000-000000000001', 'employee', 'employee@orchiva.local', '$2a$12$yAaKvCzavNhkRxSJ35d7JeykQvCZONr.5Jf5ZY/fGY0l7N4IxezDK', 'Evelyn', 'Stone', '10000000-0000-0000-0000-000000000001'),
    ('20000000-0000-0000-0000-000000000002', 'manager', 'manager@orchiva.local', '$2a$12$yAaKvCzavNhkRxSJ35d7JeykQvCZONr.5Jf5ZY/fGY0l7N4IxezDK', 'Marcus', 'Reed', '10000000-0000-0000-0000-000000000001'),
    ('20000000-0000-0000-0000-000000000003', 'finance', 'finance@orchiva.local', '$2a$12$yAaKvCzavNhkRxSJ35d7JeykQvCZONr.5Jf5ZY/fGY0l7N4IxezDK', 'Fiona', 'Chen', '10000000-0000-0000-0000-000000000002'),
    ('20000000-0000-0000-0000-000000000004', 'admin', 'admin@orchiva.local', '$2a$12$yAaKvCzavNhkRxSJ35d7JeykQvCZONr.5Jf5ZY/fGY0l7N4IxezDK', 'Avery', 'Morgan', '10000000-0000-0000-0000-000000000003');

INSERT INTO user_roles(user_id, role_id)
SELECT '20000000-0000-0000-0000-000000000001', id FROM roles WHERE name = 'EMPLOYEE';
INSERT INTO user_roles(user_id, role_id)
SELECT '20000000-0000-0000-0000-000000000002', id FROM roles WHERE name IN ('EMPLOYEE', 'MANAGER');
INSERT INTO user_roles(user_id, role_id)
SELECT '20000000-0000-0000-0000-000000000003', id FROM roles WHERE name IN ('EMPLOYEE', 'FINANCE');
INSERT INTO user_roles(user_id, role_id)
SELECT '20000000-0000-0000-0000-000000000004', id FROM roles WHERE name IN ('EMPLOYEE', 'ADMIN');

UPDATE departments SET manager_id = '20000000-0000-0000-0000-000000000002'
WHERE id = '10000000-0000-0000-0000-000000000001';
