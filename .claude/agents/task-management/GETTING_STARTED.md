# Getting Started with Advanced Task Management System

## 📚 Table of Contents
1. [Introduction](#introduction)
2. [Installation](#installation)
3. [Core Concepts](#core-concepts)
4. [Basic Usage](#basic-usage)
5. [Advanced Features](#advanced-features)
6. [Real-World Examples](#real-world-examples)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)

## Introduction

This task management system brings enterprise-grade features to your development workflow, inspired by tools like Jira, Linear, and Asana, with added AI capabilities and advanced analytics.

### What Makes This System Different?

**Comprehensive Feature Set**:
- Multi-level task hierarchy (Epic → Story → Task → Subtask)
- Advanced dependency management with 4 types
- Sprint planning with burndown charts and velocity tracking
- DORA metrics and team analytics
- AI-powered estimation and risk detection
- Workflow automation
- Real-time collaboration

**Production-Ready**:
- Built on PostgreSQL for reliability
- Optimized for 10,000+ active tasks
- Supports 100+ concurrent users
- Full audit trail
- Comprehensive test coverage

## Installation

### Prerequisites

```bash
# Check your versions
node --version  # Should be 18+
psql --version  # Should be 14+
```

### Step 1: Database Setup

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database (if not exists)
CREATE DATABASE ai_knowledge;

# Exit psql
\q
```

### Step 2: Run Migrations

```bash
# Navigate to project
cd /Users/sunilkumar/learning

# Create migrations directory if not exists
mkdir -p .claude/agents/task-management/migrations

# Apply schema
psql -U postgres -d ai_knowledge -f .claude/agents/task-management/migrations/001_init.sql
```

### Step 3: Install Dependencies

```bash
# If not already installed
npm install pg @types/pg
```

### Step 4: Configure Environment

```bash
# Create .env file
cat > .env << 'EOF'
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=ai_knowledge
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres

# Optional features
ENABLE_AI_ESTIMATION=false
ENABLE_NOTIFICATIONS=false
EOF
```

### Step 5: Verify Installation

```typescript
// test-connection.ts
import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.DATABASE_HOST || 'localhost',
  database: process.env.DATABASE_NAME || 'ai_knowledge',
  user: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
});

async function test() {
  try {
    const result = await pool.query('SELECT COUNT(*) FROM tasks');
    console.log('✅ Connected successfully! Tasks count:', result.rows[0].count);
  } catch (error) {
    console.error('❌ Connection failed:', error);
  } finally {
    await pool.end();
  }
}

test();
```

## Core Concepts

### 1. Task Hierarchy

```
Epic: "User Authentication System"
├── Story: "JWT Authentication"
│   ├── Task: "Implement JWT token generation"
│   │   ├── Subtask: "Add JWT library"
│   │   ├── Subtask: "Create token service"
│   │   └── Subtask: "Write unit tests"
│   └── Task: "Implement token refresh"
│       ├── Subtask: "Create refresh endpoint"
│       └── Subtask: "Add token validation"
└── Story: "OAuth Integration"
    └── Task: "Google OAuth setup"
```

**Key Points**:
- Epics: Large initiatives (months)
- Stories: User-facing features (weeks)
- Tasks: Technical work (days)
- Subtasks: Small units of work (hours)

### 2. Task Lifecycle

```
BACKLOG → TODO → IN_PROGRESS → CODE_REVIEW → QA → STAGING → DONE
                      ↓
                   BLOCKED (temporary state)
```

**Workflow Rules**:
- Tasks can only transition to allowed states
- Some transitions require approvals
- Automatic transitions on PR merge/deploy
- Complete audit trail maintained

### 3. Dependencies

**4 Types Supported**:

1. **Finish-to-Start (Most Common)**
   - Task B starts after Task A finishes
   - Example: Testing starts after development finishes

2. **Start-to-Start**
   - Task B starts when Task A starts
   - Example: Documentation starts when development starts

3. **Finish-to-Finish**
   - Task B finishes when Task A finishes
   - Example: Integration testing finishes when unit tests finish

4. **Start-to-Finish (Rare)**
   - Task B finishes when Task A starts
   - Example: Legacy system shutdown when new system starts

### 4. Sprints

**Sprint Lifecycle**:
```
PLANNING → ACTIVE → COMPLETED
```

**Key Metrics**:
- **Velocity**: Average points completed per sprint
- **Completion Rate**: % of committed work completed
- **Burndown**: Daily progress tracking
- **Carryover**: Incomplete work from previous sprint

## Basic Usage

### Creating Your First Task

```typescript
import { TaskService } from './.claude/agents/task-management/services/TaskService';
import { Pool } from 'pg';

const pool = new Pool({ /* config */ });
const taskService = new TaskService(pool);

// Create a simple task
const task = await taskService.createTask({
  type: 'task',
  title: 'Fix login bug on mobile',
  description: 'Users report unable to login on iOS Safari',
  priority: 'high',
  estimate: 5, // story points
  timeEstimate: 8, // hours
}, 'user-id-123');

console.log('Created task:', task.id);
```

### Creating a Full Epic

```typescript
// 1. Create Epic
const epic = await taskService.createTask({
  type: 'epic',
  title: 'User Authentication System',
  description: 'Complete overhaul of authentication',
  priority: 'high',
}, userId);

// 2. Create Story under Epic
const story = await taskService.createTask({
  type: 'story',
  title: 'JWT Authentication',
  description: 'Implement JWT-based auth',
  priority: 'high',
  parentId: epic.id,
  estimate: 13,
}, userId);

// 3. Create Tasks under Story
const task1 = await taskService.createTask({
  type: 'task',
  title: 'Implement JWT token generation',
  description: 'Create service for JWT tokens',
  priority: 'high',
  parentId: story.id,
  estimate: 5,
  assigneeId: 'dev-1',
}, userId);

const task2 = await taskService.createTask({
  type: 'task',
  title: 'Implement token refresh',
  description: 'Add refresh token logic',
  priority: 'medium',
  parentId: story.id,
  estimate: 3,
  assigneeId: 'dev-2',
}, userId);
```

### Managing Task Lifecycle

```typescript
// Assign task
await taskService.assignTask(task.id, 'developer-123');

// Start work
await taskService.transitionTask(task.id, 'in_progress', 'developer-123');

// Log time
await taskService.logWork(
  task.id,
  'developer-123',
  120, // 2 hours in minutes
  'Implemented core JWT logic'
);

// Move to code review
await taskService.transitionTask(task.id, 'code_review', 'developer-123');

// After PR approval
await taskService.transitionTask(task.id, 'qa', 'reviewer-456');

// Mark complete
await taskService.transitionTask(task.id, 'done', 'qa-engineer-789');
```

### Searching & Filtering Tasks

```typescript
// Get all tasks for current sprint
const sprintTasks = await taskService.listTasks({
  sprintId: 'sprint-42',
  status: ['in_progress', 'code_review', 'qa'],
}, 1, 50);

// Get blocked tasks
const blockedTasks = await taskService.listTasks({
  status: ['blocked'],
  teamId: 'team-123',
}, 1, 20);

// Get overdue high-priority tasks
const overdueTasks = await taskService.listTasks({
  priority: ['critical', 'high'],
  dueBefore: new Date(),
}, 1, 100);

// Full-text search
const searchResults = await taskService.listTasks({
  search: 'authentication login bug',
}, 1, 20);
```

## Advanced Features

### Sprint Management

```typescript
import { SprintService } from './.claude/agents/task-management/services/SprintService';

const sprintService = new SprintService(pool);

// Create sprint
const sprint = await sprintService.createSprint({
  name: 'Sprint 42',
  goal: 'Complete authentication system',
  startDate: new Date('2025-12-01'),
  endDate: new Date('2025-12-14'),
  capacity: 80, // story points
  teamId: 'team-123',
});

// Add tasks to sprint
await sprintService.addTaskToSprint(sprint.id, task1.id);
await sprintService.addTaskToSprint(sprint.id, task2.id);

// Start sprint
await sprintService.startSprint(sprint.id);

// Get burndown chart
const burndown = await sprintService.generateBurndownChart(sprint.id);
console.log('Burndown data:', burndown);

// Complete sprint
const report = await sprintService.completeSprint(sprint.id);
console.log('Sprint velocity:', report.velocity);
console.log('Completion rate:', report.completionRate);
```

### Dependency Management

```typescript
import { DependencyAnalyzer } from './.claude/agents/task-management/services/DependencyAnalyzer';

const dependencyAnalyzer = new DependencyAnalyzer(pool);

// Add dependency
await dependencyAnalyzer.addDependency(
  'task-backend-123',  // This task
  'task-database-456', // Depends on this task
  'finish-to-start'    // Type
);

// Check for circular dependencies
const cycles = await dependencyAnalyzer.detectCircularDependencies('task-123');
if (cycles.length > 0) {
  console.error('⚠️  Circular dependency detected!');
  console.error('Cycle:', cycles);
}

// Calculate critical path
const criticalPath = await dependencyAnalyzer.calculateCriticalPath('project-1');
console.log('Critical tasks:', criticalPath.map(t => ({
  id: t.id,
  title: t.title,
  estimate: t.estimate,
})));

// Get all blockers for a task
const blockers = await dependencyAnalyzer.identifyBlockers('task-123');
console.log('This task is blocked by:', blockers);
```

### Analytics & Metrics

```typescript
import { AnalyticsService } from './.claude/agents/task-management/services/AnalyticsService';

const analyticsService = new AnalyticsService(pool);

// Team metrics
const teamMetrics = await analyticsService.getTeamMetrics('team-123', {
  startDate: new Date('2025-11-01'),
  endDate: new Date('2025-11-30'),
});

console.log('Average velocity:', teamMetrics.averageVelocity);
console.log('Average cycle time:', teamMetrics.averageCycleTime, 'hours');
console.log('Throughput:', teamMetrics.throughputPerWeek, 'tasks/week');

// DORA metrics
const doraMetrics = await analyticsService.getDoraMetrics({
  startDate: new Date('2025-11-01'),
  endDate: new Date('2025-11-30'),
});

console.log('Deployment frequency:', doraMetrics.deploymentFrequency);
console.log('Lead time for changes:', doraMetrics.leadTimeForChanges, 'hours');
console.log('MTTR:', doraMetrics.mttr, 'hours');
console.log('Overall rating:', doraMetrics.overallRating);

// Workload analysis
const workload = await analyticsService.getTeamWorkload('team-123');
if (workload.isOverloaded) {
  console.log('⚠️  Team is overloaded!');
  console.log('Recommendations:', workload.recommendations);
}
```

## Real-World Examples

### Example 1: Feature Development Workflow

```typescript
// 1. Product Manager creates Epic
const epic = await taskService.createTask({
  type: 'epic',
  title: 'Real-time Notifications',
  description: 'Add WebSocket-based real-time notifications',
  priority: 'high',
}, 'pm-123');

// 2. Tech Lead breaks down into Stories
const story1 = await taskService.createTask({
  type: 'story',
  title: 'WebSocket Infrastructure',
  description: 'Set up WebSocket server and connection management',
  priority: 'high',
  parentId: epic.id,
  estimate: 21,
}, 'tech-lead-456');

// 3. Developers create Tasks
const task1 = await taskService.createTask({
  type: 'task',
  title: 'Set up WebSocket server',
  priority: 'high',
  parentId: story1.id,
  estimate: 8,
  assigneeId: 'dev-1',
}, 'dev-1');

const task2 = await taskService.createTask({
  type: 'task',
  title: 'Implement connection pooling',
  priority: 'high',
  parentId: story1.id,
  estimate: 5,
  assigneeId: 'dev-2',
}, 'dev-2');

// 4. Add dependency (pooling depends on server)
await dependencyAnalyzer.addDependency(task2.id, task1.id, 'finish-to-start');

// 5. Add to sprint
await sprintService.addTaskToSprint('sprint-42', task1.id);
await sprintService.addTaskToSprint('sprint-42', task2.id);

// 6. Development workflow
await taskService.transitionTask(task1.id, 'in_progress', 'dev-1');
await taskService.logWork(task1.id, 'dev-1', 240, 'Set up WebSocket server');
await taskService.transitionTask(task1.id, 'code_review', 'dev-1');
await taskService.transitionTask(task1.id, 'qa', 'reviewer-123');
await taskService.transitionTask(task1.id, 'done', 'qa-engineer-789');
```

### Example 2: Bug Tracking & Fixing

```typescript
// QA creates bug
const bug = await taskService.createTask({
  type: 'bug',
  title: 'Login fails on Safari iOS 17',
  description: 'Users report 401 error when logging in via Safari on iOS 17',
  priority: 'critical',
  labels: ['security', 'mobile', 'auth'],
}, 'qa-engineer-123');

// Assign to developer
await taskService.assignTask(bug.id, 'dev-senior-456');

// Developer investigates
await taskService.transitionTask(bug.id, 'in_progress', 'dev-senior-456');
await taskService.logWork(bug.id, 'dev-senior-456', 60, 'Investigated root cause');

// Found root cause, create subtasks
const subtask1 = await taskService.createTask({
  type: 'subtask',
  title: 'Update cookie settings for Safari',
  parentId: bug.id,
  estimate: 2,
  assigneeId: 'dev-senior-456',
}, 'dev-senior-456');

const subtask2 = await taskService.createTask({
  type: 'subtask',
  title: 'Add Safari-specific tests',
  parentId: bug.id,
  estimate: 3,
  assigneeId: 'qa-engineer-123',
}, 'dev-senior-456');

// Fix and verify
await taskService.transitionTask(subtask1.id, 'in_progress', 'dev-senior-456');
await taskService.logWork(subtask1.id, 'dev-senior-456', 90, 'Updated cookie config');
await taskService.transitionTask(subtask1.id, 'done', 'dev-senior-456');

// QA verifies fix
await taskService.transitionTask(bug.id, 'qa', 'dev-senior-456');
await taskService.transitionTask(bug.id, 'done', 'qa-engineer-123');
```

## Best Practices

### 1. Task Sizing
- **Epics**: 3-6 months, 50-200 points
- **Stories**: 1-4 weeks, 8-21 points
- **Tasks**: 1-5 days, 1-8 points
- **Subtasks**: 2-8 hours, 0.5-2 points

### 2. Sprint Planning
- Commit 60-70% of capacity (buffer for interruptions)
- Include bug fixes and tech debt (20-30%)
- Review dependencies before committing
- Set clear sprint goals

### 3. Dependency Management
- Keep dependency chains short (<5 levels)
- Review critical path regularly
- Identify and resolve blockers daily
- Use finish-to-start by default

### 4. Status Updates
- Update task status daily
- Log time worked regularly
- Add comments for context
- Mark blockers immediately

### 5. Metrics Usage
- Review velocity trends monthly
- Track cycle time to find bottlenecks
- Monitor WIP limits
- Act on workload warnings

## Troubleshooting

### Common Issues

**1. Circular Dependency Detected**
```typescript
// Error: Cannot add dependency - would create circular dependency

// Solution: Review dependency chain
const cycles = await dependencyAnalyzer.detectCircularDependencies(taskId);
console.log('Circular chain:', cycles);
// Remove one dependency from the cycle
```

**2. Sprint Overcommitted**
```typescript
// Warning: Sprint capacity exceeded

// Solution: Check capacity
const sprint = await sprintService.getSprint(sprintId);
console.log('Capacity:', sprint.capacity);
console.log('Committed:', sprint.committedPoints);
// Remove or reduce task estimates
```

**3. Task Stuck in Review**
```typescript
// Find tasks stuck in code_review > 3 days
const stuckTasks = await taskService.listTasks({
  status: ['code_review'],
  updatedBefore: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
});

// Ping reviewers or reassign
```

**4. Slow Search Performance**
```typescript
// If search is slow, check indexes
// Run in psql:
// ANALYZE tasks;
// REINDEX INDEX idx_tasks_search;
```

## Next Steps

1. **Read the API Documentation**: [API.md](./docs/API.md)
2. **Review Database Schema**: [DATABASE.md](./docs/DATABASE.md)
3. **Explore AI Features**: [AI_FEATURES.md](./docs/AI_FEATURES.md)
4. **Set Up Workflows**: [WORKFLOWS.md](./docs/WORKFLOWS.md)
5. **Deploy to Production**: [DEPLOYMENT.md](./docs/DEPLOYMENT.md)

## Support & Resources

- **Main README**: [README.md](./README.md)
- **Agent Documentation**: [10-task-management-agent.md](../10-task-management-agent.md)
- **Project Guide**: [AGENTS_GUIDE.md](../../AGENTS_GUIDE.md)

---

**Questions?** Check the troubleshooting section or review the comprehensive documentation in the docs/ directory.

**Version**: 1.0.0
**Last Updated**: 2025-11-28
