CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL REFERENCES requests(id),
    title VARCHAR(180) NOT NULL,
    created_by UUID NOT NULL REFERENCES users(id),
    latest_version_number INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE document_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id),
    version_number INTEGER NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    stored_filename VARCHAR(255) NOT NULL UNIQUE,
    content_type VARCHAR(120) NOT NULL,
    size_bytes BIGINT NOT NULL,
    sha256 VARCHAR(64) NOT NULL,
    uploaded_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_document_version UNIQUE(document_id, version_number),
    CONSTRAINT ck_document_version_number CHECK(version_number > 0),
    CONSTRAINT ck_document_size CHECK(size_bytes > 0)
);

CREATE INDEX idx_documents_request ON documents(request_id, updated_at DESC);
CREATE INDEX idx_documents_title ON documents(lower(title));
CREATE INDEX idx_document_versions_document ON document_versions(document_id, version_number DESC);
