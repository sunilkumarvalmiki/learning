# Database Optimization Agent

## Mission
Optimize all database systems (PostgreSQL, Qdrant, Neo4j, MinIO) for production-grade performance, reliability, and scalability.

## Scope
- PostgreSQL 15 + pgvector
- Qdrant vector database
- Neo4j 5 graph database
- MinIO object storage
- Database schemas and migrations
- Query optimization
- Indexing strategies
- Connection pooling
- Backup/restore procedures

## Current State Assessment

### PostgreSQL
**Strengths:**
- pgvector extension installed
- Full-text search indexes
- UUID and pg_trgm extensions

**Gaps:**
- No query performance monitoring
- Missing composite indexes
- No query optimization analysis
- Connection pooling not configured
- No backup automation
- No read replicas

### Qdrant
**Strengths:**
- Vector similarity search working
- Collection configured

**Gaps:**
- No performance tuning
- No backup strategy
- No monitoring
- Index optimization unknown

### Neo4j
**Strengths:**
- Schema defined
- Graph relationships created

**Gaps:**
- No query optimization
- No index strategy
- Not actively used yet
- No backup plan

### MinIO
**Strengths:**
- S3-compatible storage
- Console UI available

**Gaps:**
- No erasure coding
- No replication
- No versioning enabled
- No lifecycle policies

## Research Areas

### 1. PostgreSQL Performance Tuning
**Sources:**
- PostgreSQL Official Performance Tips
- Use The Index, Luke! (Markus Winand)
- pganalyze blog
- Cybertec PostgreSQL tuning guide

**Focus areas:**
- Index strategies (B-tree, GIN, GiST for tsvector)
- Query optimization (EXPLAIN ANALYZE)
- Connection pooling (PgBouncer, pg_pool)
- Partitioning strategies
- Vacuum and autovacuum tuning
- Configuration parameters (shared_buffers, work_mem, etc.)
- pg_stat_statements for query analysis

### 2. Vector Database Optimization
**Sources:**
- Qdrant documentation
- Vector search benchmarks
- HNSW algorithm papers
- Production deployment guide

**Focus areas:**
- Index parameters (m, ef_construct)
- Quantization for memory optimization
- Collection sharding
- Search performance tuning
- Batch indexing strategies
- Snapshot and recovery

### 3. Graph Database Best Practices
**Sources:**
- Neo4j Performance Tuning Guide
- Neo4j Operations Manual
- Graph data modeling patterns
- Cypher query optimization

**Focus areas:**
- Index creation strategies
- Cypher query optimization
- Memory configuration
- Relationship traversal patterns
- APOC procedures
- Backup and restore

### 4. Object Storage
**Sources:**
- MinIO deployment guide
- S3 best practices
- Erasure coding guide
- High availability setup

**Focus areas:**
- Erasure coding configuration
- Versioning and lifecycle
- Replication strategies
- Bucket policies
- Performance optimization
- Backup and disaster recovery

### 5. Backup & Disaster Recovery
**Sources:**
- Database backup strategies
- Point-in-time recovery (PITR)
- Disaster recovery best practices
- RPO/RTO planning

**Focus areas:**
- Automated backup schedules
- Backup testing procedures
- PITR for PostgreSQL
- Snapshot strategies
- Cross-region backup
- Recovery time objectives

## Improvement Tasks

### Priority 1: Critical (Performance & Reliability)

#### Task 1.1: PostgreSQL Query Optimization
**Research:**
- Enable pg_stat_statements extension
- Analyze current query patterns
- Review EXPLAIN ANALYZE for slow queries
- Study index usage statistics

**Implementation:**
- Add pg_stat_statements
- Create missing indexes
- Optimize existing queries
- Add composite indexes
- Configure query logging for slow queries (>100ms)

**Files to modify:**
- `migrations/001_initial_schema.sql` (add indexes)
- `backend/src/config/database.ts` (enable extensions, logging)
- Create `migrations/006_performance_indexes.sql`

**Acceptance criteria:**
- All foreign keys indexed
- Full-text search optimized
- Slow query log configured
- pg_stat_statements enabled
- Common queries <50ms

#### Task 1.2: Connection Pooling Configuration
**Research:**
- TypeORM connection pooling
- PgBouncer vs application-level pooling
- Pool size calculations
- Connection leak detection

**Implementation:**
- Configure TypeORM pool size
- Add connection leak detection
- Monitor active connections
- Set appropriate timeouts

**Files to modify:**
- `backend/src/config/database.ts`

**Acceptance criteria:**
- Pool size: min 2, max 10
- Idle timeout: 30s
- Connection timeout: 5s
- No connection leaks
- Pool metrics exposed

#### Task 1.3: Database Monitoring Setup
**Research:**
- pg_stat_activity
- Prometheus postgres_exporter
- Key PostgreSQL metrics
- Alert thresholds

**Implementation:**
- Add postgres_exporter to docker-compose
- Configure metric collection
- Create Grafana dashboard
- Set up basic alerts

**Files to create:**
- `docker-compose.monitoring.yml`
- `grafana/dashboards/postgres.json`

**Acceptance criteria:**
- Metrics exported to Prometheus
- Dashboard showing: connections, query time, cache hit ratio
- Alerts for connection saturation
- Historical data stored

### Priority 2: High (Indexing & Optimization)

#### Task 2.1: Qdrant Performance Tuning
**Research:**
- HNSW parameter tuning
- Quantization strategies
- Collection optimization
- Search performance benchmarks

**Implementation:**
- Optimize HNSW parameters (m=16, ef_construct=100)
- Enable scalar quantization
- Configure optimal ef_search
- Batch insertion optimization

**Files to modify:**
- `migrations/002_qdrant_collections.sql`
- `backend/src/services/EmbeddingService.ts`

**Acceptance criteria:**
- Search latency <100ms for p99
- Memory usage optimized
- Indexing throughput >1000 docs/sec
- Accuracy >95%

#### Task 2.2: Neo4j Index Strategy
**Research:**
- Neo4j index types
- Cypher query optimization
- Graph traversal patterns
- Index usage statistics

**Implementation:**
- Create indexes on frequently queried properties
- Add full-text search indexes
- Optimize relationship traversals
- Configure query caching

**Files to modify:**
- `migrations/003_neo4j_schema.cypher`
- Create `migrations/007_neo4j_indexes.cypher`

**Acceptance criteria:**
- Indexes on node properties
- Full-text search enabled
- Traversal queries <500ms
- Index hit ratio >80%

#### Task 2.3: MinIO Configuration
**Research:**
- MinIO production deployment
- Erasure coding setup
- Versioning configuration
- Lifecycle policies

**Implementation:**
- Enable versioning on buckets
- Configure lifecycle policies
- Set up replication (if multi-node)
- Optimize upload/download settings

**Files to modify:**
- `docker-compose.yml` (MinIO configuration)
- Create `scripts/setup-minio-policies.sh`

**Acceptance criteria:**
- Versioning enabled
- Lifecycle policy (delete after 90 days)
- Bucket policies configured
- Upload throughput >100MB/s

### Priority 3: Medium (Backup & DR)

#### Task 3.1: Automated Backup System
**Research:**
- PostgreSQL pg_dump vs pg_basebackup
- Qdrant snapshots
- Neo4j backup procedures
- MinIO bucket replication

**Implementation:**
- Create backup scripts for all databases
- Schedule daily backups (cron)
- Implement backup rotation (30-day retention)
- Store backups off-site (S3 or separate volume)

**Files to create:**
- `scripts/backup-postgres.sh`
- `scripts/backup-qdrant.sh`
- `scripts/backup-neo4j.sh`
- `scripts/backup-minio.sh`
- `scripts/backup-all.sh` (orchestrator)
- `cron/backup-schedule`

**Acceptance criteria:**
- Automated daily backups
- 30-day retention
- Backup success monitoring
- Restore tested monthly
- Backups <1GB compressed

#### Task 3.2: Point-in-Time Recovery (PITR)
**Research:**
- PostgreSQL WAL archiving
- Continuous backup strategies
- Recovery procedures

**Implementation:**
- Enable WAL archiving
- Configure archive_command
- Create recovery procedure docs
- Test recovery process

**Files to modify:**
- `docker-compose.yml` (PostgreSQL config)
- Create `docs/database-recovery-procedures.md`

**Acceptance criteria:**
- WAL archiving enabled
- Recovery tested successfully
- RPO <15 minutes
- RTO <1 hour
- Documented recovery steps

#### Task 3.3: Disaster Recovery Plan
**Research:**
- Multi-region DR strategies
- Failover procedures
- Data consistency during failover

**Implementation:**
- Document DR procedures
- Create failover scripts
- Test failover scenarios
- Define RPO/RTO

**Files to create:**
- `docs/disaster-recovery-plan.md`
- `scripts/failover-postgres.sh`

**Acceptance criteria:**
- DR plan documented
- Failover tested
- RPO: 1 hour
- RTO: 4 hours
- Team trained on procedures

### Priority 4: Low (Maintenance & Monitoring)

#### Task 4.1: Database Health Checks
**Research:**
- Health check best practices
- Database-specific health indicators
- Automated health monitoring

**Implementation:**
- Enhance /health endpoint
- Check all database connections
- Report version information
- Check disk space
- Monitor replication lag (if applicable)

**Files to modify:**
- `backend/src/routes/index.ts`
- Create `backend/src/services/HealthCheckService.ts`

**Acceptance criteria:**
- /health checks all 4 databases
- Returns detailed status
- <200ms response time
- Includes version info
- Alerts on unhealthy

#### Task 4.2: Schema Migration Best Practices
**Research:**
- Zero-downtime migrations
- Migration testing
- Rollback strategies

**Implementation:**
- Create migration guidelines
- Add migration testing
- Implement rollback scripts
- Version control all migrations

**Files to create:**
- `docs/database-migrations-guide.md`
- `scripts/test-migration.sh`

**Acceptance criteria:**
- All migrations reversible
- Migrations tested before production
- Guidelines documented
- No data loss risk

## Database Configuration Optimization

### PostgreSQL Configuration
**Research and implement optimal settings:**

```sql
-- Example optimizations (research to confirm)
shared_buffers = 256MB          # 25% of RAM
effective_cache_size = 1GB      # 50% of RAM
work_mem = 16MB                 # Per operation
maintenance_work_mem = 64MB     # For VACUUM, etc.
max_connections = 100
checkpoint_completion_target = 0.9
wal_buffers = 16MB
random_page_cost = 1.1          # SSD optimization
effective_io_concurrency = 200  # SSD
```

### Qdrant Configuration
```yaml
# Optimize collection parameters
vectors:
  size: 384
  distance: Cosine
optimizers_config:
  indexing_threshold: 20000
hnsw_config:
  m: 16                # Connections per element
  ef_construct: 100    # Quality during indexing
  full_scan_threshold: 10000
quantization:
  scalar:
    type: int8
    quantile: 0.99
```

## Monitoring Metrics

### PostgreSQL
- Active connections
- Query duration (p50, p95, p99)
- Cache hit ratio (>90% target)
- Deadlocks
- Replication lag (if applicable)
- Table bloat
- Index usage

### Qdrant
- Search latency
- Indexing throughput
- Memory usage
- Collection size
- Search accuracy

### Neo4j
- Query duration
- Active transactions
- Store sizes
- Page cache hit ratio
- Heap memory usage

### MinIO
- Request rate
- Bandwidth (up/down)
- Error rate
- Disk usage
- Object count

## Validation Checklist

- [ ] All queries <500ms (p99)
- [ ] Indexes created and used
- [ ] Connection pooling configured
- [ ] Backups automated and tested
- [ ] Monitoring dashboards created
- [ ] Health checks comprehensive
- [ ] DR plan documented
- [ ] Performance benchmarks recorded

## Success Metrics

### Before
- Query optimization: None
- Connection pooling: Default
- Backups: Manual
- Monitoring: Basic
- Indexes: Minimal

### Target
- Query p99: <100ms
- Connection pool: Optimized
- Backups: Automated daily
- Monitoring: Comprehensive
- Indexes: All foreign keys + full-text

## Output Report

```markdown
## Database Optimization Agent Report

### Databases Optimized
- PostgreSQL
- Qdrant
- Neo4j
- MinIO

### Performance Improvements
| Database | Metric | Before | After |
|----------|--------|--------|-------|
| PostgreSQL | Query p99 | XXms | YYms |
| PostgreSQL | Cache hit | XX% | YY% |
| Qdrant | Search p99 | XXms | YYms |
| Neo4j | Traversal p99 | XXms | YYms |

### Indexes Added
- PostgreSQL: N indexes
- Neo4j: M indexes
- Qdrant: Optimized parameters

### Backup System
- Automated: ✓
- Tested: ✓
- Retention: 30 days
- Location: [path/S3]

### Monitoring
- Dashboards created: N
- Metrics tracked: M
- Alerts configured: P

### Next Priorities
1. [Priority 1]
2. [Priority 2]
```

---

**Status**: Ready to execute
**Priority**: P1 - Critical
**Estimated Time**: 3-5 hours
**Dependencies**: Backend service running
**Version**: 1.0
