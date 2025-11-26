-- Simplified documents table without pgvector
-- Run this to create documents table
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    -- Content
    title VARCHAR(500) NOT NULL,
    content TEXT,
    summary TEXT,
    -- File metadata
    file_path VARCHAR(1000),
    file_name VARCHAR(255),
    file_size_bytes BIGINT,
    file_type file_type,
    mime_type VARCHAR(100),
    -- Processing status
    status document_status DEFAULT 'uploading' NOT NULL,
    processing_error TEXT,
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMPTZ
);
CREATE INDEX idx_documents_user ON documents(user_id)
WHERE deleted_at IS NULL;
CREATE INDEX idx_documents_workspace ON documents(workspace_id)
WHERE deleted_at IS NULL;
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_documents_created_at ON documents(created_at DESC);