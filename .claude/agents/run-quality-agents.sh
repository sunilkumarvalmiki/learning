#!/bin/bash

###############################################################################
# AI Knowledge System - Quality Improvement Automation Script
#
# This script orchestrates the execution of Claude AI agents to continuously
# improve codebase quality to production-grade standards.
#
# Usage:
#   ./run-quality-agents.sh [options]
#
# Options:
#   --agent=NAME       Run specific agent (e.g., backend, security)
#   --priority=LEVEL   Run agents by priority (P0, P1, P2, all)
#   --dry-run          Show what would run without executing
#   --parallel         Run agents in parallel (experimental)
#   --report           Generate summary report only
#   --help             Show this help message
#
# Examples:
#   ./run-quality-agents.sh                    # Run orchestrator
#   ./run-quality-agents.sh --agent=backend    # Run backend agent only
#   ./run-quality-agents.sh --priority=P1      # Run all P1 agents
#   ./run-quality-agents.sh --dry-run          # Preview execution
###############################################################################

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
REPORTS_DIR="$SCRIPT_DIR/reports"
LOG_FILE="$REPORTS_DIR/agent-execution-$(date +%Y%m%d-%H%M%S).log"

# Default values
MODE="orchestrator"
PRIORITY="all"
DRY_RUN=false
PARALLEL=false
REPORT_ONLY=false

# Ensure reports directory exists
mkdir -p "$REPORTS_DIR"

###############################################################################
# Helper Functions
###############################################################################

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $*" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $*" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $*" | tee -a "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $*" | tee -a "$LOG_FILE"
}

show_banner() {
    echo ""
    echo "╔════════════════════════════════════════════════════════════════╗"
    echo "║   AI Knowledge System - Production Quality Agents             ║"
    echo "║   Continuous Code Quality Improvement Automation              ║"
    echo "╚════════════════════════════════════════════════════════════════╝"
    echo ""
}

show_help() {
    cat << EOF
AI Knowledge System - Quality Agents Runner

Usage: $0 [options]

Options:
    --agent=NAME       Run specific agent:
                       orchestrator, backend, frontend, database,
                       security, performance, infrastructure,
                       documentation, testing, monitoring

    --priority=LEVEL   Run agents by priority:
                       P0 (critical: orchestrator, security)
                       P1 (high: backend, frontend, database, performance, testing)
                       P2 (medium: infrastructure, documentation, monitoring)
                       all (default: run all agents)

    --dry-run          Preview what would run without executing
    --parallel         Run compatible agents in parallel (experimental)
    --report           Generate summary report from previous runs
    --help             Show this help message

Examples:
    $0                              # Run orchestrator (default)
    $0 --agent=backend              # Run backend quality agent
    $0 --priority=P1                # Run all P1 priority agents
    $0 --dry-run --priority=all     # Preview all agents
    $0 --report                     # Generate summary report

EOF
}

check_prerequisites() {
    log "Checking prerequisites..."

    # Check if we're in the right directory
    if [ ! -f "$PROJECT_ROOT/package.json" ] && [ ! -f "$PROJECT_ROOT/backend/package.json" ]; then
        log_error "Not in project root directory!"
        exit 1
    fi

    # Check git status
    if [ -n "$(git status --porcelain)" ]; then
        log_warning "Working directory has uncommitted changes"
        log_warning "Agents may create commits. Consider committing your changes first."
        read -p "Continue anyway? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi

    log_success "Prerequisites check passed"
}

run_agent() {
    local agent_file=$1
    local agent_name=$(basename "$agent_file" .md)

    log "Starting agent: $agent_name"

    if [ "$DRY_RUN" = true ]; then
        log_warning "[DRY RUN] Would execute: $agent_file"
        return 0
    fi

    # Create a git branch for this agent's work
    local branch_name="agent/${agent_name}/$(date +%Y%m%d-%H%M%S)"
    git checkout -b "$branch_name" 2>/dev/null || true

    # TODO: Actual Claude Code agent execution
    # This is a placeholder - actual execution depends on Claude Code CLI
    # claude-code run-agent "$agent_file"

    log_warning "Agent execution framework not yet integrated with Claude Code CLI"
    log "Agent file: $agent_file"
    log "Next steps:"
    log "1. Open Claude Code"
    log "2. Load agent: $agent_file"
    log "3. Let agent execute its improvements"
    log "4. Review and commit changes"

    # For now, just return success
    log_success "Agent $agent_name prepared (manual execution required)"

    return 0
}

run_orchestrator() {
    log "Running Orchestrator Agent..."
    run_agent "$SCRIPT_DIR/00-orchestrator-agent.md"
}

run_priority_agents() {
    local priority=$1

    case $priority in
        P0)
            log "Running P0 (Critical) agents..."
            run_agent "$SCRIPT_DIR/00-orchestrator-agent.md"
            run_agent "$SCRIPT_DIR/04-security-compliance-agent.md"
            ;;
        P1)
            log "Running P1 (High Priority) agents..."
            run_agent "$SCRIPT_DIR/01-backend-quality-agent.md"
            run_agent "$SCRIPT_DIR/02-frontend-quality-agent.md"
            run_agent "$SCRIPT_DIR/03-database-optimization-agent.md"
            run_agent "$SCRIPT_DIR/05-performance-optimization-agent.md"
            run_agent "$SCRIPT_DIR/08-testing-qa-agent.md"
            ;;
        P2)
            log "Running P2 (Medium Priority) agents..."
            run_agent "$SCRIPT_DIR/06-infrastructure-devops-agent.md"
            run_agent "$SCRIPT_DIR/07-documentation-quality-agent.md"
            run_agent "$SCRIPT_DIR/09-monitoring-observability-agent.md"
            ;;
        all)
            log "Running all agents..."
            for agent_file in "$SCRIPT_DIR"/*-agent.md; do
                run_agent "$agent_file"
            done
            ;;
        *)
            log_error "Unknown priority: $priority"
            exit 1
            ;;
    esac
}

run_specific_agent() {
    local agent_name=$1

    case $agent_name in
        orchestrator)
            run_agent "$SCRIPT_DIR/00-orchestrator-agent.md"
            ;;
        backend)
            run_agent "$SCRIPT_DIR/01-backend-quality-agent.md"
            ;;
        frontend)
            run_agent "$SCRIPT_DIR/02-frontend-quality-agent.md"
            ;;
        database)
            run_agent "$SCRIPT_DIR/03-database-optimization-agent.md"
            ;;
        security)
            run_agent "$SCRIPT_DIR/04-security-compliance-agent.md"
            ;;
        performance)
            run_agent "$SCRIPT_DIR/05-performance-optimization-agent.md"
            ;;
        infrastructure|devops)
            run_agent "$SCRIPT_DIR/06-infrastructure-devops-agent.md"
            ;;
        documentation|docs)
            run_agent "$SCRIPT_DIR/07-documentation-quality-agent.md"
            ;;
        testing|qa)
            run_agent "$SCRIPT_DIR/08-testing-qa-agent.md"
            ;;
        monitoring|observability)
            run_agent "$SCRIPT_DIR/09-monitoring-observability-agent.md"
            ;;
        *)
            log_error "Unknown agent: $agent_name"
            log "Available agents: orchestrator, backend, frontend, database, security, performance, infrastructure, documentation, testing, monitoring"
            exit 1
            ;;
    esac
}

generate_summary_report() {
    log "Generating summary report..."

    local report_file="$REPORTS_DIR/summary-report-$(date +%Y%m%d-%H%M%S).md"

    cat > "$report_file" << EOF
# AI Knowledge System - Quality Agents Summary Report

**Generated**: $(date)

## Execution Summary

- **Project**: AI Knowledge Management System
- **Repository**: /Users/sunilkumar/learning
- **Report Directory**: $REPORTS_DIR

## Available Agents

### Priority 0 (Critical)
- 00-orchestrator-agent.md - Master coordinator
- 04-security-compliance-agent.md - OWASP Top 10, GDPR

### Priority 1 (High)
- 01-backend-quality-agent.md - API, services, testing
- 02-frontend-quality-agent.md - React, Tauri, accessibility
- 03-database-optimization-agent.md - PostgreSQL, Qdrant, Neo4j
- 05-performance-optimization-agent.md - Latency, caching
- 08-testing-qa-agent.md - Test coverage >80%

### Priority 2 (Medium)
- 06-infrastructure-devops-agent.md - Docker, K8s, CI/CD
- 07-documentation-quality-agent.md - API docs, diagrams
- 09-monitoring-observability-agent.md - Metrics, logging

## Current Project Status

### Backend
- Test Coverage: ~40% → Target: >80%
- API Endpoints: 13+
- Security: 0 vulnerabilities ✓

### Frontend
- Components: 11 production components
- Tests: 125 Storybook tests
- Coverage: Unknown → Target: >80%

### Databases
- PostgreSQL + pgvector
- Qdrant (vector search)
- Neo4j (graph)
- MinIO (object storage)

## Recent Agent Executions

$(find "$REPORTS_DIR" -name "*.log" -mtime -7 | sort -r | head -5 | while read log; do echo "- $(basename $log)"; done)

## Next Steps

1. Review agent definitions in .claude/agents/
2. Execute prioritized agents (start with P0)
3. Monitor improvements via git commits
4. Track metrics over time
5. Iterate until production-grade

## How to Run

\`\`\`bash
# Run orchestrator (recommended first run)
./run-quality-agents.sh

# Run specific agent
./run-quality-agents.sh --agent=backend

# Run by priority
./run-quality-agents.sh --priority=P1

# Preview without execution
./run-quality-agents.sh --dry-run --priority=all
\`\`\`

## Resources

- **Agent README**: .claude/agents/README.md
- **Documentation**: docs/
- **GitHub**: https://github.com/sunilkumarvalmiki/learning

---

*This is an automated report. For detailed agent execution logs, see: $REPORTS_DIR/*
EOF

    log_success "Summary report generated: $report_file"
    cat "$report_file"
}

###############################################################################
# Main Execution
###############################################################################

main() {
    show_banner

    # Parse arguments
    for arg in "$@"; do
        case $arg in
            --agent=*)
                MODE="agent"
                AGENT_NAME="${arg#*=}"
                ;;
            --priority=*)
                MODE="priority"
                PRIORITY="${arg#*=}"
                ;;
            --dry-run)
                DRY_RUN=true
                ;;
            --parallel)
                PARALLEL=true
                log_warning "Parallel execution is experimental"
                ;;
            --report)
                REPORT_ONLY=true
                ;;
            --help)
                show_help
                exit 0
                ;;
            *)
                log_error "Unknown option: $arg"
                show_help
                exit 1
                ;;
        esac
    done

    log "Quality Agents Execution Started"
    log "Mode: $MODE"
    log "Dry Run: $DRY_RUN"
    log "Log File: $LOG_FILE"
    echo ""

    if [ "$REPORT_ONLY" = true ]; then
        generate_summary_report
        exit 0
    fi

    check_prerequisites

    case $MODE in
        orchestrator)
            run_orchestrator
            ;;
        agent)
            run_specific_agent "$AGENT_NAME"
            ;;
        priority)
            run_priority_agents "$PRIORITY"
            ;;
        *)
            log_error "Invalid mode: $MODE"
            exit 1
            ;;
    esac

    echo ""
    log_success "Quality Agents Execution Completed!"
    log "Log file: $LOG_FILE"
    log ""
    log "Next Steps:"
    log "1. Review changes made by agents"
    log "2. Run tests: npm test"
    log "3. Review git diff"
    log "4. Commit if all tests pass"
    log "5. Generate report: $0 --report"
}

# Run main function with all arguments
main "$@"
