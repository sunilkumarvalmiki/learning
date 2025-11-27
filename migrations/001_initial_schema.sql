-- Migration 001: Initial Schema
-- Database: PostgreSQL 15+
-- Extensions: pgvector, uuid-ossp
-- Created: 2025-01-25
-- ========================================
-- EXTENSIONS
-- ========================================
-- UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- Vector similarity search (using Qdrant instead)
-- CREATE EXTENSION IF NOT EXISTS vector;
-- Full-text search (built-in, just verify)
-- SELECT * FROM pg_extension WHERE extname = 'pg_trgm';
CREATE EXTENSION IF NOT EXISTS pg_trgm;
-- ========================================
-- ENUMS
-- ========================================
CREATE TYPE user_role AS ENUM (
    'free',
    'pro',
    'team_member',
    'team_admin',
    'enterprise'
);
CREATE TYPE document_status AS ENUM ('uploading', 'processing', 'completed', 'failed');
CREATE TYPE file_type AS ENUM (
    'pdf',
    'docx',
    'txt',
    'md',
    'image',
    'video',
    'audio',
    'other'
);
-- ========================================
-- TABLES
-- ========================================
-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    role user_role DEFAULT 'free' NOT NULL,
    storage_used_bytes BIGINT DEFAULT 0 NOT NULL,
    storage_limit_bytes BIGINT DEFAULT 5368709120 NOT NULL,
    -- 5GB for free tier
    -- Subscription
    subscription_id VARCHAR(255),
    -- Stripe subscription ID
    subscription_status VARCHAR(50),
    -- active, canceled, past_due
    subscription_current_period_end TIMESTAMPTZ,
    -- Security
    email_verified BOOLEAN DEFAULT false,
    two_factor_enabled BOOLEAN DEFAULT false,
    two_factor_secret VARCHAR(255),
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    last_login_at TIMESTAMPTZ,
    -- Soft delete
    deleted_at TIMESTAMPTZ,
    -- Indexes
    CONSTRAINT users_email_check CHECK (
        email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$'
    )
);
CREATE INDEX idx_users_email ON users(email)
WHERE deleted_at IS NULL;
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_created_at ON users(created_at DESC);
-- Workspaces (for team collaboration)
CREATE TABLE workspaces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    -- Settings
    storage_limit_bytes BIGINT DEFAULT 107374182400 NOT NULL,
    -- 100GB for teams
    storage_used_bytes BIGINT DEFAULT 0 NOT NULL,
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMPTZ
);
CREATE INDEX idx_workspaces_owner ON workspaces(owner_id);
-- Workspace members
CREATE TABLE workspace_members (
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member' NOT NULL,
    -- owner, admin, member, viewer
    joined_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    PRIMARY KEY (workspace_id, user_id)
);
CREATE INDEX idx_workspace_members_user ON workspace_members(user_id);
-- Documents
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    -- Content
    title VARCHAR(500) NOT NULL,
    content TEXT,
    -- Markdown content
    summary TEXT,
    -- AI-generated summary
    -- File metadata
    file_path VARCHAR(1000),
    -- S3/MinIO path
    file_name VARCHAR(255),
    file_size_bytes BIGINT,
    file_type file_type,
    mime_type VARCHAR(100),
    -- Processing status
    status document_status DEFAULT 'uploading' NOT NULL,
    processing_error TEXT,
    ocr_confidence DECIMAL(5, 4),
    -- 0.0 to 1.0
    -- AI metadata
    language VARCHAR(10) DEFAULT 'en',
    reading_time_minutes INTEGER,
    complexity_score DECIMAL(3, 2),
    -- Flesch-Kincaid or similar
    -- Vector embedding (384 dimensions for all-MiniLM-L6-v2)
    embedding vector(384),
    -- Full-text search
    content_tsvector tsvector GENERATED ALWAYS AS (
        setweight(to_tsvector('english', coalesce(title, '')), 'A') || setweight(
            to_tsvector('english', coalesce(content, '')),
            'B'
        )
    ) STORED,
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMPTZ,
    -- Version control
    version INTEGER DEFAULT 1 NOT NULL,
    parent_version_id UUID REFERENCES documents(id) ON DELETE
    SET NULL
);
CREATE INDEX idx_documents_user ON documents(user_id)
WHERE deleted_at IS NULL;
CREATE INDEX idx_documents_workspace ON documents(workspace_id)
WHERE deleted_at IS NULL;
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_documents_created_at ON documents(created_at DESC);
CREATE INDEX idx_documents_file_type ON documents(file_type);
-- Full-text search index
CREATE INDEX idx_documents_content_search ON documents USING GIN (content_tsvector);
-- Vector similarity search index (HNSW for fast approximate nearest neighbor)
CREATE INDEX idx_documents_embedding ON documents USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64);
-- Tags
CREATE TABLE tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(7) DEFAULT '#6366f1',
    -- Hex color
    description TEXT,
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    -- Unique constraint per user/workspace
    CONSTRAINT tags_unique_name UNIQUE (user_id, workspace_id, name)
);
CREATE INDEX idx_tags_user ON tags(user_id);
CREATE INDEX idx_tags_workspace ON tags(workspace_id);
CREATE INDEX idx_tags_name ON tags(name);
-- Document-Tag relationships (many-to-many)
CREATE TABLE document_tags (
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    PRIMARY KEY (document_id, tag_id)
);
CREATE INDEX idx_document_tags_document ON document_tags(document_id);
CREATE INDEX idx_document_tags_tag ON document_tags(tag_id);
-- Notes (standalone notes not attached to documents)
CREATE TABLE notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    -- Vector embedding
    embedding vector(384),
    -- Full-text search
    content_tsvector tsvector GENERATED ALWAYS AS (
        setweight(to_tsvector('english', coalesce(title, '')), 'A') || setweight(
            to_tsvector('english', coalesce(content, '')),
            'B'
        )
    ) STORED,
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMPTZ
);
CREATE INDEX idx_notes_user ON notes(user_id)
WHERE deleted_at IS NULL;
CREATE INDEX idx_notes_workspace ON notes(workspace_id)
WHERE deleted_at IS NULL;
CREATE INDEX idx_notes_created_at ON notes(created_at DESC);
CREATE INDEX idx_notes_content_search ON notes USING GIN (content_tsvector);
CREATE INDEX idx_notes_embedding ON notes USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64);
-- AI Transformations (multi-level understanding)
CREATE TABLE transformations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    source_note_id UUID REFERENCES notes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    -- Transformation type
    target_level VARCHAR(50) NOT NULL,
    -- 'kid', 'student', 'expert', 'phd'
    model_used VARCHAR(100),
    -- 'gpt-4', 'claude-3', etc.
    -- Transformed content
    title VARCHAR(500),
    content TEXT NOT NULL,
    -- Quality metrics
    readability_score DECIMAL(5, 2),
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    -- Ensure either document or note is set, not both
    CONSTRAINT transformations_source_check CHECK (
        (
            source_document_id IS NOT NULL
            AND source_note_id IS NULL
        )
        OR (
            source_document_id IS NULL
            AND source_note_id IS NOT NULL
        )
    )
);
CREATE INDEX idx_transformations_document ON transformations(source_document_id);
CREATE INDEX idx_transformations_note ON transformations(source_note_id);
CREATE INDEX idx_transformations_user ON transformations(user_id);
CREATE INDEX idx_transformations_level ON transformations(target_level);
-- Search history (for analytics and personalization)
CREATE TABLE search_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    query TEXT NOT NULL,
    query_type VARCHAR(50),
    -- 'keyword', 'semantic', 'hybrid'
    results_count INTEGER,
    clicked_document_id UUID REFERENCES documents(id) ON DELETE
    SET NULL,
        click_position INTEGER,
        -- Position of clicked result (1-indexed)
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE INDEX idx_search_history_user ON search_history(user_id);
CREATE INDEX idx_search_history_created_at ON search_history(created_at DESC);
-- Activity log (audit trail)
CREATE TABLE activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE
    SET NULL,
        workspace_id UUID REFERENCES workspaces(id) ON DELETE
    SET NULL,
        action VARCHAR(100) NOT NULL,
        -- 'document.created', 'user.login', etc.
        resource_type VARCHAR(50),
        -- 'document', 'note', 'tag', etc.
        resource_id UUID,
        -- Additional context
        metadata JSONB,
        ip_address INET,
        user_agent TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE INDEX idx_activity_log_user ON activity_log(user_id);
CREATE INDEX idx_activity_log_workspace ON activity_log(workspace_id);
CREATE INDEX idx_activity_log_action ON activity_log(action);
CREATE INDEX idx_activity_log_created_at ON activity_log(created_at DESC);
CREATE INDEX idx_activity_log_metadata ON activity_log USING GIN (metadata);
-- ========================================
-- FUNCTIONS & TRIGGERS
-- ========================================
-- Update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- Apply to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE
UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_documents_updated_at BEFORE
UPDATE ON documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notes_updated_at BEFORE
UPDATE ON notes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_workspaces_updated_at BEFORE
UPDATE ON workspaces FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- Update storage used when document is created/deleted
CREATE OR REPLACE FUNCTION update_storage_usage() RETURNS TRIGGER AS $$ BEGIN IF TG_OP = 'INSERT' THEN -- Increment storage
    IF NEW.workspace_id IS NOT NULL THEN
UPDATE workspaces
SET storage_used_bytes = storage_used_bytes + COALESCE(NEW.file_size_bytes, 0)
WHERE id = NEW.workspace_id;
ELSE
UPDATE users
SET storage_used_bytes = storage_used_bytes + COALESCE(NEW.file_size_bytes, 0)
WHERE id = NEW.user_id;
END IF;
ELSIF TG_OP = 'DELETE' THEN -- Decrement storage
IF OLD.workspace_id IS NOT NULL THEN
UPDATE workspaces
SET storage_used_bytes = storage_used_bytes - COALESCE(OLD.file_size_bytes, 0)
WHERE id = OLD.workspace_id;
ELSE
UPDATE users
SET storage_used_bytes = storage_used_bytes - COALESCE(OLD.file_size_bytes, 0)
WHERE id = OLD.user_id;
END IF;
END IF;
RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER update_storage_on_document_change
AFTER
INSERT
    OR DELETE ON documents FOR EACH ROW EXECUTE FUNCTION update_storage_usage();
-- ========================================
-- VIEWS
-- ========================================
-- Active documents (not deleted)
CREATE VIEW active_documents AS
SELECT *
FROM documents
WHERE deleted_at IS NULL;
-- User storage summary
CREATE VIEW user_storage_summary AS
SELECT u.id,
    u.email,
    u.role,
    u.storage_used_bytes,
    u.storage_limit_bytes,
    ROUND(
        (
            u.storage_used_bytes::DECIMAL / u.storage_limit_bytes
        ) * 100,
        2
    ) AS storage_used_percentage,
    COUNT(d.id) AS document_count
FROM users u
    LEFT JOIN documents d ON d.user_id = u.id
    AND d.deleted_at IS NULL
GROUP BY u.id;
-- ========================================
-- COMMENTS
-- ========================================
COMMENT ON TABLE users IS 'User accounts with subscription and storage information';
COMMENT ON TABLE documents IS 'Uploaded documents with embeddings and full-text search';
COMMENT ON TABLE tags IS 'User-defined tags for organizing documents';
COMMENT ON TABLE transformations IS 'AI-generated content at different complexity levels';
COMMENT ON COLUMN documents.embedding IS 'Vector embedding (384-dim) for semantic search';
COMMENT ON COLUMN documents.content_tsvector IS 'Full-text search vector (auto-generated)';
COMMENT ON INDEX idx_documents_embedding IS 'HNSW index for fast approximate nearest neighbor search';