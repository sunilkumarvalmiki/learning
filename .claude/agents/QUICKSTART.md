# Quick Start Guide - Production Quality Agents

Get started with the AI Knowledge System quality improvement agents in 5 minutes.

## What Are These Agents?

Claude AI agents that automatically research best practices, analyze your codebase, and implement production-grade improvements across:

- Backend API quality & testing
- Frontend performance & accessibility
- Database optimization
- Security hardening (OWASP Top 10)
- Performance optimization
- Infrastructure & CI/CD
- Documentation
- Monitoring & observability

## Prerequisites

- Git repository (clean working directory recommended)
- Node.js 18+ installed
- Access to Claude Code or Claude API

## Quick Start

### 1. Understand the Agent System

```bash
cd /Users/sunilkumar/learning/.claude/agents

# View available agents
ls -1 *-agent.md

# Output:
# 00-orchestrator-agent.md          (Master coordinator)
# 01-backend-quality-agent.md       (Backend improvements)
# 02-frontend-quality-agent.md      (Frontend improvements)
# 03-database-optimization-agent.md (Database tuning)
# 04-security-compliance-agent.md   (Security hardening)
# 05-performance-optimization-agent.md (Performance)
# 06-infrastructure-devops-agent.md (DevOps)
# 07-documentation-quality-agent.md (Docs)
# 08-testing-qa-agent.md            (Testing)
# 09-monitoring-observability-agent.md (Monitoring)
```

### 2. First Run - Recommended Approach

**Option A: Manual Execution (Recommended for first time)**

1. Open any agent file (start with backend or security)
2. Read the Research Areas and Implementation Tasks
3. Use Claude Code to help implement the improvements
4. Follow the agent's guidance step by step

**Option B: Using the Automation Script**

```bash
# Make script executable (already done)
chmod +x run-quality-agents.sh

# Preview what would run (dry run)
./run-quality-agents.sh --dry-run

# Run orchestrator agent
./run-quality-agents.sh

# Run specific agent
./run-quality-agents.sh --agent=backend

# Run by priority
./run-quality-agents.sh --priority=P1
```

### 3. Agent Execution Example

Let's run the **Backend Quality Agent** as an example:

#### Manual Execution with Claude Code:

```bash
# 1. Open the agent file
cat 01-backend-quality-agent.md

# 2. In Claude Code, ask:
"I want to implement the improvements from the backend quality agent.
Let's start with Priority 1: Critical tasks.
Please help me implement Task 1.1: Request Validation."

# 3. Claude will:
# - Research best practices (Zod vs Joi)
# - Create validation schemas
# - Implement middleware
# - Add tests
# - Update documentation

# 4. Review changes
git diff

# 5. Run tests
cd ../backend
npm test

# 6. Commit if tests pass
git add .
git commit -m "feat: add request validation (Backend Quality Agent)"
```

## Agent Priority Guide

### Start Here (Priority 0 - Critical)
1. **Security Agent** - Fix vulnerabilities first
2. **Orchestrator** - Get overall assessment

### Then (Priority 1 - High Impact)
3. **Backend Quality** - API stability
4. **Testing Agent** - Coverage >80%
5. **Frontend Quality** - User experience
6. **Database Optimization** - Performance
7. **Performance Agent** - Speed improvements

### Later (Priority 2 - Important)
8. **Infrastructure** - Deployment ready
9. **Documentation** - Team knowledge
10. **Monitoring** - Observability

## What Each Agent Does

### Backend Quality Agent
**Before**: 40% test coverage, no API docs, no rate limiting
**After**: >80% coverage, Swagger docs, rate limiting, input validation

**Key Improvements**:
- ✅ Add 200+ tests (unit + integration)
- ✅ Generate Swagger/OpenAPI docs
- ✅ Implement rate limiting
- ✅ Add request validation (Zod)
- ✅ Enhance error handling

### Security & Compliance Agent
**Before**: Basic security, no OWASP coverage
**After**: OWASP Top 10 100% addressed, GDPR ready

**Key Improvements**:
- ✅ Fix all OWASP Top 10 vulnerabilities
- ✅ Add input sanitization
- ✅ Implement GDPR data export/deletion
- ✅ Security headers Grade A
- ✅ Audit logging

### Performance Agent
**Before**: Unknown latency, no caching
**After**: API p99 <500ms, caching, optimized

**Key Improvements**:
- ✅ Response compression (60%+ size reduction)
- ✅ Redis caching layer
- ✅ Query optimization
- ✅ Bundle size <150KB
- ✅ Load testing with k6

### Frontend Quality Agent
**Before**: 125 tests (Storybook only)
**After**: >90% coverage, WCAG AA compliant

**Key Improvements**:
- ✅ React Testing Library tests for all components
- ✅ Zero accessibility violations
- ✅ E2E tests for critical flows
- ✅ Bundle optimization
- ✅ Visual regression testing

## Typical Workflow

```
Week 1: Security & Backend
├── Day 1-2: Security Agent (OWASP Top 10)
├── Day 3-5: Backend Quality Agent (Tests + Docs)
└── Day 6-7: Database Optimization

Week 2: Frontend & Performance
├── Day 1-3: Frontend Quality Agent
├── Day 4-5: Performance Agent
└── Day 6-7: Testing Agent (coverage)

Week 3: Infrastructure & Monitoring
├── Day 1-3: Infrastructure Agent (K8s, CI/CD)
├── Day 4-5: Documentation Agent
└── Day 6-7: Monitoring Agent

Week 4: Iteration & Polish
├── Review all improvements
├── Run full test suite
├── Performance benchmarking
└── Production deployment prep
```

## Example Commands

```bash
# Check current project status
cd /Users/sunilkumar/learning
git status

# Run backend tests
cd backend
npm test
npm run lint

# Run frontend tests
cd ../ai-knowledge-ui
npm test

# View agent reports
cd .claude/agents
./run-quality-agents.sh --report

# Start with highest priority
./run-quality-agents.sh --priority=P0

# Run specific improvements
./run-quality-agents.sh --agent=security
./run-quality-agents.sh --agent=backend
./run-quality-agents.sh --agent=performance
```

## Quality Metrics Dashboard

Track your progress:

| Metric | Current | Target | Agent |
|--------|---------|--------|-------|
| Backend Test Coverage | ~40% | >80% | Backend, Testing |
| Frontend Test Coverage | Unknown | >90% | Frontend, Testing |
| API Documentation | None | 13+ endpoints | Backend |
| Security Vulnerabilities | 0 ✓ | 0 ✓ | Security |
| OWASP Coverage | ~30% | 100% | Security |
| API p99 Latency | Unknown | <500ms | Performance |
| Bundle Size | Unknown | <150KB | Frontend, Performance |
| Lighthouse Score | Unknown | >90 | Frontend |

## Expected Results

### After Backend Agent (4-6 hours)
- Test coverage: 40% → >80%
- API endpoints documented: 0 → 13+
- Rate limiting: Implemented
- Request validation: All endpoints
- Integration tests: All endpoints covered

### After Security Agent (6-8 hours)
- OWASP Top 10: 100% addressed
- Security headers: Grade A
- GDPR compliance: 100%
- Vulnerability scans: Automated in CI

### After Performance Agent (5-7 hours)
- API p99: <500ms
- Response compression: >60% reduction
- Caching: Redis implemented
- Bundle size: <150KB
- Load tests: Passing at 1000 req/s

## Troubleshooting

### Agent seems overwhelming?
Start small:
```bash
# Just read the agent file first
cat 01-backend-quality-agent.md

# Pick ONE task from Priority 1
# Example: "Task 1.1: Implement Request Validation"

# Ask Claude Code to help with just that task
```

### Tests failing after agent changes?
```bash
# Revert changes
git checkout .

# Try again with smaller scope
# Focus on one improvement at a time
```

### Not sure which agent to run?
```bash
# Start with the orchestrator
./run-quality-agents.sh

# It will analyze and recommend priorities
```

## Advanced Usage

### Custom Agent Execution Order
```bash
# 1. Security first (always)
./run-quality-agents.sh --agent=security

# 2. Backend quality
./run-quality-agents.sh --agent=backend

# 3. Database optimization
./run-quality-agents.sh --agent=database

# 4. Performance
./run-quality-agents.sh --agent=performance

# 5. Testing
./run-quality-agents.sh --agent=testing
```

### Automated Schedule (Cron)
```bash
# Edit crontab
crontab -e

# Add weekly execution (Sundays at 2 AM)
0 2 * * 0 cd /Users/sunilkumar/learning/.claude/agents && ./run-quality-agents.sh --priority=P1 >> /tmp/quality-agents.log 2>&1
```

## Getting Help

### Resources
- **Main README**: [README.md](README.md) - Complete documentation
- **Agent Config**: [agent-config.json](agent-config.json) - Configuration
- **Project Status**: [../../PROJECT_STATUS.md](../../PROJECT_STATUS.md) - Current state

### Support
- Check agent logs: `.claude/agents/reports/`
- Review agent file for details
- Each agent has Research Areas with sources
- Ask Claude Code for clarification

## Next Steps

1. **Choose your starting point**:
   - Critical issues? → Security Agent
   - Need tests? → Backend/Testing Agent
   - Slow performance? → Performance Agent
   - Poor UX? → Frontend Agent

2. **Read the agent file** completely before starting

3. **Work incrementally**:
   - One Priority level at a time
   - One task at a time
   - Commit frequently

4. **Measure progress**:
   - Run tests after each change
   - Track metrics
   - Generate reports

5. **Iterate**:
   - Agents can run multiple times
   - Each iteration improves quality
   - Stop when targets met

## Success Checklist

After running all agents, you should have:

- [ ] Backend test coverage >80%
- [ ] Frontend test coverage >90%
- [ ] Zero security vulnerabilities
- [ ] OWASP Top 10 100% addressed
- [ ] API fully documented (Swagger)
- [ ] Performance <500ms p99
- [ ] Monitoring dashboards created
- [ ] CI/CD fully automated
- [ ] Documentation complete
- [ ] Production deployment ready

## Questions?

Read the full [README.md](README.md) for comprehensive documentation.

---

**Ready to start? Pick an agent and begin improving your codebase!**

```bash
# Recommended first agent
./run-quality-agents.sh --agent=security
```

**Last Updated**: 2025-11-27
