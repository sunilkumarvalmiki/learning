-- Seed Data for Development and Testing
-- Run after 001_initial_schema.sql

-- ===========================================
-- TEST USERS
-- ===========================================

-- Free tier user
INSERT INTO users (id, email, password_hash, full_name, role, email_verified) VALUES
('00000000-0000-0000-0000-000000000001', 'demo@example.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5lXaPVYUsF4Q.', 'Demo User', 'free', true);

-- Pro tier user
INSERT INTO users (id, email, password_hash, full_name, role, email_verified, storage_limit_bytes) VALUES
('00000000-0000-0000-0000-000000000002', 'pro@example.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5lXaPVYUsF4Q.', 'Pro User', 'pro', true, 53687091200); -- 50GB

-- Team admin
INSERT INTO users (id, email, password_hash, full_name, role, email_verified) VALUES
('00000000-0000-0000-0000-000000000003', 'team@example.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5lXaPVYUsF4Q.', 'Team Admin', 'team_admin', true);

-- ===========================================
-- WORKSPACES
-- ===========================================

INSERT INTO workspaces (id, name, owner_id) VALUES
('00000000-0000-0000-0000-000000000010', 'Team Workspace', '00000000-0000-0000-0000-000000000003');

-- Workspace members
INSERT INTO workspace_members (workspace_id, user_id, role) VALUES
('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000003', 'owner'),
('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000002', 'member');

-- ===========================================
-- TAGS
-- ===========================================

INSERT INTO tags (id, user_id, name, color) VALUES
('00000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000001', 'machine-learning', '#3b82f6'),
('00000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000001', 'research', '#10b981'),
('00000000-0000-0000-0000-000000000022', '00000000-0000-0000-0000-000000000001', 'important', '#ef4444'),
('00000000-0000-0000-0000-000000000023', '00000000-0000-0000-0000-000000000001', 'tutorial', '#f59e0b'),
('00000000-0000-0000-0000-000000000024', '00000000-0000-0000-0000-000000000001', 'archived', '#6b7280');

-- ===========================================
-- SAMPLE DOCUMENTS
-- ===========================================

-- Sample document 1: Completed PDF
INSERT INTO documents (
    id, user_id, title, content, summary, file_name, file_size_bytes, file_type, 
    mime_type, status, language, reading_time_minutes, complexity_score
) VALUES (
    '00000000-0000-0000-0000-000000000030',
    '00000000-0000-0000-0000-000000000001',
    'Introduction to Machine Learning',
    E'# Introduction to Machine Learning\n\nMachine learning is a subset of artificial intelligence...\n\n## Supervised Learning\n\nIn supervised learning, we train models on labeled data...',
    'This document provides a comprehensive introduction to machine learning, covering supervised and unsupervised learning techniques.',
    'ml_intro.pdf',
    2048576, -- 2MB
    'pdf',
    'application/pdf',
    'completed',
    'en',
    15,
    7.5
);

-- Sample document 2: Processing
INSERT INTO documents (
    id, user_id, title, file_name, file_size_bytes, file_type, status
) VALUES (
    '00000000-0000-0000-0000-000000000031',
    '00000000-0000-0000-0000-000000000001',
    'Deep Learning Research Paper',
    'deep_learning_2024.pdf',
    10485760, -- 10MB
    'pdf',
    'processing'
);

-- Sample document 3: Failed
INSERT INTO documents (
    id, user_id, title, file_name, file_size_bytes, file_type, status, processing_error
) VALUES (
    '00000000-0000-0000-0000-000000000032',
    '00000000-0000-0000-0000-000000000001',
    'Corrupted File',
    'corrupted.pdf',
    1024,
    'pdf',
    'failed',
    'PDF parsing error: Invalid PDF structure'
);

-- Sample document 4: Team workspace document
INSERT INTO documents (
    id, user_id, workspace_id, title, content, file_name, file_size_bytes, file_type, status
) VALUES (
    '00000000-0000-0000-0000-000000000033',
    '00000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000010',
    'Team Project Proposal',
    E'# Project Proposal\n\nThis is a collaborative document for our team project...',
    'proposal.md',
    8192,
    'md',
    'completed'
);

-- ===========================================
-- DOCUMENT-TAG RELATIONSHIPS
-- ===========================================

INSERT INTO document_tags (document_id, tag_id) VALUES
('00000000-0000-0000-0000-000000000030', '00000000-0000-0000-0000-000000000020'), -- ml-intro tagged with machine-learning
('00000000-0000-0000-0000-000000000030', '00000000-0000-0000-0000-000000000023'), -- ml-intro tagged with tutorial
('00000000-0000-0000-0000-000000000031', '00000000-0000-0000-0000-000000000021'); -- deep-learning tagged with research

-- ===========================================
-- NOTES
-- ===========================================

INSERT INTO notes (id, user_id, title, content) VALUES
('00000000-0000-0000-0000-000000000040', '00000000-0000-0000-0000-000000000001', 'Daily Standup Notes', E'## 2025-01-25\n\n- Reviewed ML paper\n- Started implementation\n- Need to research XGBoost'),
('00000000-0000-0000-0000-000000000041', '00000000-0000-0000-0000-000000000001', 'Reading List', E'# Books to Read\n\n1. Deep Learning by Goodfellow\n2. Hands-On Machine Learning\n3. Pattern Recognition'),
('00000000-0000-0000-0000-000000000042', '00000000-0000-0000-0000-000000000002', 'Pro User Note', 'This is a note from the pro tier user.');

-- ===========================================
-- TRANSFORMATIONS
-- ===========================================

INSERT INTO transformations (
    id, source_document_id, user_id, target_level, model_used, title, content, readability_score
) VALUES (
    '00000000-0000-0000-0000-000000000050',
    '00000000-0000-0000-0000-000000000030',
    '00000000-0000-0000-0000-000000000001',
    'kid',
    'gpt-4',
    'Machine Learning for Kids',
    E'# What is Machine Learning?\n\nImagine teaching your dog new tricks. You show your dog what to do, and your dog learns! Machine learning is like teaching computers to learn from examples just like dogs learn tricks...',
    95.5
);

-- ===========================================
-- SEARCH HISTORY
-- ===========================================

INSERT INTO search_history (user_id, query, query_type, results_count, clicked_document_id, click_position) VALUES
('00000000-0000-0000-0000-000000000001', 'machine learning basics', 'semantic', 5, '00000000-0000-0000-0000-000000000030', 1),
('00000000-0000-0000-0000-000000000001', 'neural networks', 'keyword', 3, NULL, NULL),
('00000000-0000-0000-0000-000000000001', 'deep learning tutorial', 'hybrid', 7, '00000000-0000-0000-0000-000000000030', 2);

-- ===========================================
-- ACTIVITY LOG
-- ===========================================

INSERT INTO activity_log (user_id, action, resource_type, resource_id, metadata, ip_address) VALUES
('00000000-0000-0000-0000-000000000001', 'user.login', 'user', '00000000-0000-0000-0000-000000000001', '{"method": "email"}', '192.168.1.100'),
('00000000-0000-0000-0000-000000000001', 'document.created', 'document', '00000000-0000-0000-0000-000000000030', '{"file_type": "pdf", "size_bytes": 2048576}', '192.168.1.100'),
('00000000-0000-0000-0000-000000000001', 'document.viewed', 'document', '00000000-0000-0000-0000-000000000030', '{"view_duration_seconds": 120}', '192.168.1.100'),
('00000000-0000-0000-0000-000000000001', 'search.performed', NULL, NULL, '{"query": "machine learning", "results_count": 5}', '192.168.1.100');

-- ===========================================
-- UPDATE STORAGE USAGE
-- ===========================================

-- This will be automatically calculated bytriggers, but for initial seed data:
UPDATE users SET storage_used_bytes = 12582912 WHERE id = '00000000-0000-0000-0000-000000000001'; -- 12MB
UPDATE users SET storage_used_bytes = 0 WHERE id = '00000000-0000-0000-0000-000000000002';
UPDATE workspaces SET storage_used_bytes = 8192 WHERE id = '00000000-0000-0000-0000-000000000010'; -- 8KB

-- ===========================================
-- VERIFICATION QUERIES
-- ===========================================

-- Check user storage
-- SELECT * FROM user_storage_summary;

-- Check active documents
-- SELECT id, title, status, file_type FROM active_documents;

-- Full-text search test
-- SELECT title, ts_rank(content_tsvector, to_tsquery('english', 'machine & learning')) AS rank
-- FROM documents
-- WHERE content_tsvector @@ to_tsquery('english', 'machine & learning')
-- ORDER BY rank DESC;

-- Verify triggers working
-- SELECT u.email, u.storage_used_bytes, COUNT(d.id) as doc_count
-- FROM users u
-- LEFT JOIN documents d ON d.user_id = u.id AND d.deleted_at IS NULL
-- GROUP BY u.id;
