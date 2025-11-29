# Agent Coordination System

Streamlined execution system for Claude quality improvement agents with integrated state tracking and automatic cleanup - **zero redundant files**.

## Features

✅ **Integrated State Tracking** - All agent states stored in PostgreSQL, not files  
✅ **Automatic Cleanup** - Temporary files auto-deleted after data migration  
✅ **Orphan Detection** - Weekly verification ensures no leftover files  
✅ **Consolidated Reporting** - Single unified report per execution cycle  
✅ **Database-First** - Query agent states from DB, not file system  

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  Agent Execution Coordinator                 │
│  • In-memory state tracking                                  │
│  • Direct PostgreSQL persistence                            │
│  • No intermediate files                                     │
└──────────────────┬──────────────────────────────────────────┘
                   │
        ┌──────────┴──────────┬──────────────────┐
        │                     │                   │
┌───────▼────────┐  ┌────────▼────────┐  ┌──────▼─────────┐
│  Cleanup       │  │   Integrated    │  │   PostgreSQL   │
│  Orchestrator  │  │   Reporter      │  │   Database     │
│  • File track  │  │  • Query DB     │  │  • Agent state │
│  • Auto-delete │  │  • Consolidate  │  │  • Findings    │
│  • Orphan scan │  │  • Single file  │  │  • Metrics     │
└────────────────┘  └─────────────────┘  └────────────────┘
```

## Installation

```bash
cd .claude/agents/coordination
npm install
npm run build
```

## Usage

### Run Agents with Integrated Tracking

```bash
# Run Priority 0 agents (Orchestrator, Security, Task Management)
npm start -- run --priority P0

# Run specific agent
npm start -- run --agent 01

# Run all agents
npm start -- run --priority all

# Custom database URL
npm start -- run --priority P1 --db-url postgresql://localhost/custom_db
```

### Generate Consolidated Report

```bash
# Generate report from latest execution
npm start -- report

# Generate report for specific execution
npm start -- report --execution-id exec-123456

# Save to custom location
npm start -- report --output /path/to/report.md
```

### Cleanup Operations

```bash
# Detect orphan files
npm start -- cleanup --detect-orphans

# View cleanup status
npm start -- cleanup

# Emergency cleanup (dry-run)
npm start -- cleanup --emergency --dry-run

# Emergency cleanup (actually delete)
npm start -- cleanup --emergency --no-dry-run
```

## Configuration

### Environment Variables

```bash
# Database connection (required)
export DATABASE_URL="postgresql://user:password@localhost:5432/ai_knowledge"

# Optional: Configure cleanup intervals
export CLEANUP_INTERVAL_MS=3600000  # 1 hour
export ARCHIVE_AFTER_DAYS=30
```

### Programmatic Usage

```typescript
import { AgentExecutionCoordinator } from './agent_execution_coordinator';

const coordinator = new AgentExecutionCoordinator({
  integratedTracking: true,
  autoCleanup: true,
  verifyClean: true,
  consolidatedReport: true,
  databaseUrl: process.env.DATABASE_URL!,
});

// Track agent execution
await coordinator.trackAgentExecution('01', {
  status: 'running',
  startTime: new Date(),
  progress: 50,
});

// Generate report
const report = await coordinator.generateConsolidatedReport();
console.log(report);

await coordinator.close();
```

## Database Schema

The system creates these tables automatically:

### `agent_execution_states`

Stores all agent execution state without needing separate files:

```sql
CREATE TABLE agent_execution_states (
  id UUID PRIMARY KEY,
  execution_id VARCHAR(100),
  agent_id VARCHAR(100),
  name VARCHAR(200),
  priority VARCHAR(10),
  status VARCHAR(50),
  start_time TIMESTAMP,
  end_time TIMESTAMP,
  progress INTEGER,
  findings JSONB,
  improvements JSONB,
  metrics JSONB,
  temporary_files TEXT[],
  errors TEXT[],
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### `file_registry`

Tracks all created files for cleanup:

```sql
CREATE TABLE file_registry (
  id UUID PRIMARY KEY,
  filepath TEXT UNIQUE,
  purpose TEXT,
  created_at TIMESTAMP,
  ttl INTEGER,
  agent_id VARCHAR(100),
  data_in_database BOOLEAN,
  deleted_at TIMESTAMP
);
```

## Benefits Over File-Based Tracking

| Aspect | File-Based | Database-Integrated |
|--------|------------|---------------------|
| **State Storage** | Multiple JSON files | Single database |
| **Orphan Files** | Common problem | Auto-detected & cleaned |
| **Querying** | Parse multiple files | SQL queries |
| **Concurrency** | File locking issues | ACID transactions |
| **Cleanup** | Manual process | Automated |
| **Reports** | One per agent | Single consolidated |

## Monitoring

### Track Agent Progress

```typescript
const coordinator = new AgentExecutionCoordinator(config);

// Track progress updates
await coordinator.trackAgentExecution('01', {
  progress: 25,
  findings: [{
    severity: 'high',
    description: 'Missing input validation',
    location: 'api/users.ts:45',
    recommendation: 'Add Zod schema validation',
  }],
});
```

### Weekly Orphan Detection

Set up cron job for automatic orphan detection:

```bash
# Add to crontab
0 3 * * 0 cd /path/to/project && npm run cleanup -- --detect-orphans
```

## Troubleshooting

### Database Connection Issues

```bash
# Test database connection
npm start -- report

# If fails, check DATABASE_URL
echo $DATABASE_URL

# Verify PostgreSQL is running
psql $DATABASE_URL -c "SELECT 1"
```

### Orphan Files Detected

```bash
# View orphan files
npm start -- cleanup --detect-orphans

# Review before deleting
npm start -- cleanup --emergency --dry-run

# Delete if safe
npm start -- cleanup --emergency --no-dry-run
```

### Agent Execution Failed

```bash
# Check agent states in database
psql $DATABASE_URL -c "
  SELECT agent_id, status, errors 
  FROM agent_execution_states 
  WHERE status = 'failed' 
  ORDER BY updated_at DESC
"

# Review consolidated report
npm start -- report
```

## Examples

### Complete Workflow

```bash
# 1. Run Priority 0 agents
npm start -- run --priority P0

# 2. Generate report
npm start -- report --output reports/p0-results.md

# 3. Verify cleanup
npm start -- cleanup --detect-orphans

# 4. If orphans found, emergency cleanup
npm start -- cleanup --emergency --dry-run
```

### Custom Integration

```typescript
import { 
  AgentExecutionCoordinator,
  CleanupOrchestrator,
  IntegratedReporter 
} from './coordination';

async function runCustomWorkflow() {
  const config = {
    integratedTracking: true,
    autoCleanup: true,
    verifyClean: true,
    consolidatedReport: true,
    databaseUrl: process.env.DATABASE_URL!,
  };

  const coordinator = new AgentExecutionCoordinator(config);
  const cleanup = new CleanupOrchestrator(config.databaseUrl);
  const reporter = new IntegratedReporter(config.databaseUrl);

  // Execute agents
  for (const agentId of ['00', '04', '10']) {
    await coordinator.trackAgentExecution(agentId, {
      status: 'running',
      startTime: new Date(),
    });

    // ... agent execution logic ...

    await coordinator.trackAgentExecution(agentId, {
      status: 'completed',
      endTime: new Date(),
      progress: 100,
    });
  }

  // Generate and save report
  const report = await reporter.generateConsolidatedReport();
  await reporter.saveReport(report);

  // Cleanup
  await cleanup.cleanupAfterMigration();

  await coordinator.close();
  await cleanup.close();
  await reporter.close();
}
```

## Contributing

When adding new features:

1. **Never create tracking files** - use database only
2. **Register all temporary files** - use `cleanup.registerFile()`
3. **Mark data migration** - call `cleanup.markDataInDatabase()`
4. **Auto-delete after migration** - temporary files should have TTL

## License

MIT
