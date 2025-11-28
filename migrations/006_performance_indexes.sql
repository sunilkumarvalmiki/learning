-- Migration 006: Performance Indexes and Query Optimization
-- Database: PostgreSQL 15+
-- Purpose: Optimize query performance to achieve <100ms p99 latency
-- Created: 2025-01-28
-- ========================================
-- PERFORMANCE EXTENSIONS
-- ========================================

-- Enable pg_stat_statements for query performance monitoring
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- ========================================
-- COMPOSITE INDEXES
-- ========================================

-- Composite index for user + workspace queries (common pattern)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_documents_user_workspace_created
ON documents(user_id, workspace_id, created_at DESC)
WHERE deleted_at IS NULL;

-- Composite index for status queries (monitoring pending/processing documents)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_documents_status_created
ON documents(status, created_at DESC)
WHERE deleted_at IS NULL;

-- Composite index for file type filtering with date sorting
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_documents_filetype_created
ON documents(file_type, created_at DESC)
WHERE deleted_at IS NULL;

-- Composite index for workspace member lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_workspace_members_workspace_role
ON workspace_members(workspace_id, role);

-- ========================================
-- PARTIAL INDEXES FOR ACTIVE RECORDS
-- ========================================

-- Partial index for active notes (exclude deleted)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notes_user_active
ON notes(user_id, created_at DESC)
WHERE deleted_at IS NULL;

-- Partial index for completed documents only
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_documents_completed
ON documents(user_id, created_at DESC)
WHERE status = 'completed' AND deleted_at IS NULL;

-- Partial index for failed documents (for error monitoring)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_documents_failed
ON documents(user_id, created_at DESC)
WHERE status = 'failed';

-- ========================================
-- SEARCH OPTIMIZATION INDEXES
-- ========================================

-- Index for search history queries (user's recent searches)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_search_history_user_recent
ON search_history(user_id, created_at DESC);

-- Index for popular search terms analysis
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_search_history_query_count
ON search_history(query, created_at DESC);

-- ========================================
-- TRANSFORMATIONS INDEXES
-- ========================================

-- Composite index for document transformations lookup
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transformations_doc_level
ON transformations(source_document_id, target_level)
WHERE source_document_id IS NOT NULL;

-- Composite index for note transformations lookup
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transformations_note_level
ON transformations(source_note_id, target_level)
WHERE source_note_id IS NOT NULL;

-- ========================================
-- ACTIVITY LOG OPTIMIZATION
-- ========================================

-- Composite index for user activity timeline
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_activity_log_user_recent
ON activity_log(user_id, created_at DESC)
WHERE user_id IS NOT NULL;

-- Composite index for workspace activity
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_activity_log_workspace_recent
ON activity_log(workspace_id, created_at DESC)
WHERE workspace_id IS NOT NULL;

-- Partial index for specific action types (common queries)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_activity_log_document_actions
ON activity_log(resource_id, created_at DESC)
WHERE resource_type = 'document';

-- ========================================
-- STORAGE OPTIMIZATION INDEXES
-- ========================================

-- Index for storage quota checks
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_storage_usage
ON users(storage_used_bytes DESC)
WHERE deleted_at IS NULL;

-- Index for workspace storage tracking
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_workspaces_storage_usage
ON workspaces(storage_used_bytes DESC)
WHERE deleted_at IS NULL;

-- ========================================
-- AUTHENTICATION & SECURITY INDEXES
-- ========================================

-- Index for email verification checks
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email_verified
ON users(email_verified, created_at DESC)
WHERE deleted_at IS NULL;

-- Index for subscription status queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_subscription_status
ON users(subscription_status, subscription_current_period_end)
WHERE subscription_status IS NOT NULL;

-- ========================================
-- VACUUM AND ANALYZE
-- ========================================

-- Update table statistics for query planner optimization
ANALYZE users;
ANALYZE documents;
ANALYZE notes;
ANALYZE workspaces;
ANALYZE workspace_members;
ANALYZE tags;
ANALYZE document_tags;
ANALYZE transformations;
ANALYZE search_history;
ANALYZE activity_log;

-- ========================================
-- QUERY PERFORMANCE MONITORING SETUP
-- ========================================

-- Reset pg_stat_statements to start fresh monitoring
SELECT pg_stat_statements_reset();

-- Create view for slow query monitoring
CREATE OR REPLACE VIEW slow_queries AS
SELECT
    query,
    calls,
    total_exec_time,
    mean_exec_time,
    max_exec_time,
    stddev_exec_time,
    rows
FROM pg_stat_statements
WHERE mean_exec_time > 100 -- Queries slower than 100ms
ORDER BY mean_exec_time DESC
LIMIT 50;

-- Create view for most frequently called queries
CREATE OR REPLACE VIEW frequent_queries AS
SELECT
    query,
    calls,
    total_exec_time,
    mean_exec_time,
    rows
FROM pg_stat_statements
ORDER BY calls DESC
LIMIT 50;

-- Create view for cache hit ratio monitoring
CREATE OR REPLACE VIEW cache_hit_ratio AS
SELECT
    'index hit rate' AS metric,
    CASE
        WHEN sum(idx_blks_hit) + sum(idx_blks_read) = 0 THEN 100.0
        ELSE (sum(idx_blks_hit) / NULLIF(sum(idx_blks_hit) + sum(idx_blks_read), 0)::FLOAT) * 100
    END AS ratio
FROM pg_statio_user_indexes
UNION ALL
SELECT
    'table hit rate' AS metric,
    CASE
        WHEN sum(heap_blks_hit) + sum(heap_blks_read) = 0 THEN 100.0
        ELSE (sum(heap_blks_hit) / NULLIF(sum(heap_blks_hit) + sum(heap_blks_read), 0)::FLOAT) * 100
    END AS ratio
FROM pg_statio_user_tables;

-- ========================================
-- INDEX USAGE STATISTICS VIEW
-- ========================================

CREATE OR REPLACE VIEW index_usage_stats AS
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan AS index_scans,
    idx_tup_read AS tuples_read,
    idx_tup_fetch AS tuples_fetched,
    pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
ORDER BY idx_scan ASC, pg_relation_size(indexrelid) DESC;

-- ========================================
-- TABLE BLOAT MONITORING VIEW
-- ========================================

CREATE OR REPLACE VIEW table_bloat_stats AS
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) AS indexes_size,
    n_live_tup AS live_tuples,
    n_dead_tup AS dead_tuples,
    CASE
        WHEN n_live_tup > 0
        THEN round((n_dead_tup::FLOAT / n_live_tup::FLOAT) * 100, 2)
        ELSE 0
    END AS dead_tuple_percent
FROM pg_stat_user_tables
ORDER BY n_dead_tup DESC;

-- ========================================
-- COMMENTS
-- ========================================

COMMENT ON VIEW slow_queries IS 'Monitor queries with >100ms average execution time';
COMMENT ON VIEW frequent_queries IS 'Monitor most frequently executed queries';
COMMENT ON VIEW cache_hit_ratio IS 'Monitor PostgreSQL cache hit ratios (target >90%)';
COMMENT ON VIEW index_usage_stats IS 'Track index usage to identify unused indexes';
COMMENT ON VIEW table_bloat_stats IS 'Monitor table bloat from dead tuples';

-- ========================================
-- CONFIGURATION RECOMMENDATIONS
-- ========================================

-- To apply these settings, add to postgresql.conf or docker environment:
/*
shared_buffers = 256MB              # 25% of available RAM
effective_cache_size = 1GB          # 50-75% of available RAM
work_mem = 16MB                     # Per operation memory
maintenance_work_mem = 64MB         # For VACUUM, CREATE INDEX
max_connections = 100               # Adjust based on application needs
checkpoint_completion_target = 0.9  # Spread checkpoints
wal_buffers = 16MB                  # Write-ahead log buffers
random_page_cost = 1.1              # SSD optimization (default 4.0 for HDD)
effective_io_concurrency = 200      # SSD parallel I/O
max_worker_processes = 4            # Parallel query workers
max_parallel_workers_per_gather = 2 # Workers per query
max_parallel_workers = 4            # Total parallel workers

-- Logging for slow queries
log_min_duration_statement = 100    # Log queries >100ms
log_statement = 'none'              # Don't log all statements
log_duration = off                  # Don't log all durations
shared_preload_libraries = 'pg_stat_statements'
pg_stat_statements.track = 'all'    # Track all queries
*/

-- ========================================
-- VERIFICATION QUERIES
-- ========================================

-- Check index creation status
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- Check table sizes
SELECT
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) AS indexes_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
