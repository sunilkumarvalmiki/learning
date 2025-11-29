/**
 * Agent Execution Coordinator
 * 
 * Central coordination system for Claude quality agents that provides:
 * - In-memory state tracking without creating redundant files
 * - Direct database integration for persistence
 * - Real-time progress monitoring
 * - Automatic cleanup of temporary artifacts
 * - Consolidated reporting
 */

import { Pool } from 'pg';
import { promises as fs } from 'fs';
import { join } from 'path';

export interface AgentState {
    agentId: string;
    name: string;
    priority: 'P0' | 'P1' | 'P2';
    status: 'pending' | 'running' | 'completed' | 'failed' | 'blocked';
    startTime?: Date;
    endTime?: Date;
    progress: number; // 0-100
    findings: Finding[];
    improvements: Improvement[];
    metrics: Record<string, any>;
    temporaryFiles: string[];
    errors?: string[];
}

export interface Finding {
    id: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    category: string;
    description: string;
    location: string;
    recommendation: string;
}

export interface Improvement {
    id: string;
    type: 'feature' | 'bugfix' | 'optimization' | 'refactor';
    description: string;
    filesModified: string[];
    testsCovered: string[];
    metricsImpact: Record<string, any>;
}

export interface ExecutionConfig {
    integratedTracking: boolean;
    autoCleanup: boolean;
    verifyClean: boolean;
    consolidatedReport: boolean;
    databaseUrl: string;
}

export class AgentExecutionCoordinator {
    private agentStates: Map<string, AgentState>;
    private database: Pool;
    private config: ExecutionConfig;
    private executionId: string;

    constructor(config: ExecutionConfig) {
        this.agentStates = new Map();
        this.config = config;
        this.executionId = this.generateExecutionId();

        // Initialize database connection if integrated tracking enabled
        if (config.integratedTracking) {
            this.database = new Pool({
                connectionString: config.databaseUrl,
            });
            this.initializeDatabase();
        }
    }

    private generateExecutionId(): string {
        return `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    private async initializeDatabase(): Promise<void> {
        // Create tables for agent state tracking if they don't exist
        await this.database.query(`
      CREATE TABLE IF NOT EXISTS agent_execution_states (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        execution_id VARCHAR(100) NOT NULL,
        agent_id VARCHAR(100) NOT NULL,
        name VARCHAR(200) NOT NULL,
        priority VARCHAR(10) NOT NULL,
        status VARCHAR(50) NOT NULL,
        start_time TIMESTAMP,
        end_time TIMESTAMP,
        progress INTEGER DEFAULT 0,
        findings JSONB DEFAULT '[]'::jsonb,
        improvements JSONB DEFAULT '[]'::jsonb,
        metrics JSONB DEFAULT '{}'::jsonb,
        temporary_files TEXT[] DEFAULT ARRAY[]::TEXT[],
        errors TEXT[],
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_agent_exec_execution_id ON agent_execution_states(execution_id);
      CREATE INDEX IF NOT EXISTS idx_agent_exec_agent_id ON agent_execution_states(agent_id);
      CREATE INDEX IF NOT EXISTS idx_agent_exec_status ON agent_execution_states(status);
    `);
    }

    /**
     * Track agent execution state without creating separate files
     * All state is maintained in-memory and persisted to database
     */
    async trackAgentExecution(agentId: string, state: Partial<AgentState>): Promise<void> {
        const currentState = this.agentStates.get(agentId) || this.createInitialState(agentId);
        const updatedState: AgentState = { ...currentState, ...state };

        this.agentStates.set(agentId, updatedState);

        // Persist to database if integrated tracking enabled
        if (this.config.integratedTracking && this.database) {
            await this.persistAgentState(agentId, updatedState);
        }
    }

    private createInitialState(agentId: string): AgentState {
        return {
            agentId,
            name: this.getAgentName(agentId),
            priority: this.getAgentPriority(agentId),
            status: 'pending',
            progress: 0,
            findings: [],
            improvements: [],
            metrics: {},
            temporaryFiles: [],
        };
    }

    private async persistAgentState(agentId: string, state: AgentState): Promise<void> {
        await this.database.query(`
      INSERT INTO agent_execution_states (
        execution_id, agent_id, name, priority, status, 
        start_time, end_time, progress, findings, improvements,
        metrics, temporary_files, errors
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      ON CONFLICT (id) DO UPDATE SET
        status = EXCLUDED.status,
        end_time = EXCLUDED.end_time,
        progress = EXCLUDED.progress,
        findings = EXCLUDED.findings,
        improvements = EXCLUDED.improvements,
        metrics = EXCLUDED.metrics,
        temporary_files = EXCLUDED.temporary_files,
        errors = EXCLUDED.errors,
        updated_at = NOW()
    `, [
            this.executionId,
            agentId,
            state.name,
            state.priority,
            state.status,
            state.startTime,
            state.endTime,
            state.progress,
            JSON.stringify(state.findings),
            JSON.stringify(state.improvements),
            JSON.stringify(state.metrics),
            state.temporaryFiles,
            state.errors,
        ]);
    }

    /**
     * Register a temporary file for future cleanup
     */
    async registerTemporaryFile(agentId: string, filepath: string, ttl?: number): Promise<void> {
        const state = this.agentStates.get(agentId);
        if (state) {
            state.temporaryFiles.push(filepath);
            await this.trackAgentExecution(agentId, state);
        }

        // Schedule auto-deletion if TTL provided
        if (ttl && this.config.autoCleanup) {
            setTimeout(async () => {
                await this.deleteTemporaryFile(filepath);
            }, ttl);
        }
    }

    /**
     * Delete temporary file and update tracking
     */
    private async deleteTemporaryFile(filepath: string): Promise<void> {
        try {
            await fs.unlink(filepath);
            console.log(`✓ Deleted temporary file: ${filepath}`);

            // Remove from all agent states
            for (const [agentId, state] of this.agentStates) {
                const index = state.temporaryFiles.indexOf(filepath);
                if (index > -1) {
                    state.temporaryFiles.splice(index, 1);
                    await this.trackAgentExecution(agentId, state);
                }
            }
        } catch (error) {
            console.error(`Failed to delete temporary file ${filepath}:`, error);
        }
    }

    /**
     * Cleanup all temporary files for an agent after completion
     */
    async cleanupAgentFiles(agentId: string): Promise<void> {
        const state = this.agentStates.get(agentId);
        if (!state || !this.config.autoCleanup) {
            return;
        }

        for (const filepath of state.temporaryFiles) {
            await this.deleteTemporaryFile(filepath);
        }

        state.temporaryFiles = [];
        await this.trackAgentExecution(agentId, state);
    }

    /**
     * Generate consolidated report from all agent executions
     * Returns a single unified report instead of multiple files
     */
    async generateConsolidatedReport(): Promise<string> {
        const agents = Array.from(this.agentStates.values());
        const reportDate = new Date().toISOString().split('T')[0];

        let report = `# Claude Agents Consolidated Execution Report\n\n`;
        report += `**Execution ID**: ${this.executionId}\n`;
        report += `**Date**: ${reportDate}\n`;
        report += `**Total Agents**: ${agents.length}\n\n`;

        // Overall status
        report += `## Overall Status\n\n`;
        const statusCounts = this.getStatusCounts(agents);
        report += `- ✅ Completed: ${statusCounts.completed}\n`;
        report += `- 🔄 Running: ${statusCounts.running}\n`;
        report += `- ⏳ Pending: ${statusCounts.pending}\n`;
        report += `- ❌ Failed: ${statusCounts.failed}\n`;
        report += `- 🚫 Blocked: ${statusCounts.blocked}\n\n`;

        // Agent details by priority
        for (const priority of ['P0', 'P1', 'P2']) {
            const priorityAgents = agents.filter(a => a.priority === priority);
            if (priorityAgents.length === 0) continue;

            report += `## Priority ${priority} Agents\n\n`;

            for (const agent of priorityAgents) {
                report += this.formatAgentSection(agent);
            }
        }

        // Consolidated findings
        report += this.formatConsolidatedFindings(agents);

        // Consolidated improvements
        report += this.formatConsolidatedImprovements(agents);

        // Overall metrics
        report += this.formatOverallMetrics(agents);

        // Cleanup status
        if (this.config.autoCleanup) {
            report += this.formatCleanupStatus(agents);
        }

        // Save consolidated report
        if (this.config.consolidatedReport) {
            const reportPath = join(
                process.cwd(),
                '.claude/agents/reports',
                `consolidated-${reportDate}.md`
            );
            await fs.mkdir(join(process.cwd(), '.claude/agents/reports'), { recursive: true });
            await fs.writeFile(reportPath, report);
            console.log(`\n✓ Consolidated report saved: ${reportPath}`);
        }

        return report;
    }

    private getStatusCounts(agents: AgentState[]): Record<string, number> {
        return {
            completed: agents.filter(a => a.status === 'completed').length,
            running: agents.filter(a => a.status === 'running').length,
            pending: agents.filter(a => a.status === 'pending').length,
            failed: agents.filter(a => a.status === 'failed').length,
            blocked: agents.filter(a => a.status === 'blocked').length,
        };
    }

    private formatAgentSection(agent: AgentState): string {
        let section = `### ${agent.name}\n\n`;
        section += `- **Status**: ${this.getStatusEmoji(agent.status)} ${agent.status.toUpperCase()}\n`;
        section += `- **Progress**: ${agent.progress}%\n`;

        if (agent.startTime) {
            section += `- **Started**: ${agent.startTime.toISOString()}\n`;
        }
        if (agent.endTime) {
            section += `- **Completed**: ${agent.endTime.toISOString()}\n`;
            const duration = (agent.endTime.getTime() - agent.startTime!.getTime()) / 1000 / 60;
            section += `- **Duration**: ${duration.toFixed(2)} minutes\n`;
        }

        section += `- **Findings**: ${agent.findings.length}\n`;
        section += `- **Improvements**: ${agent.improvements.length}\n\n`;

        return section;
    }

    private formatConsolidatedFindings(agents: AgentState[]): string {
        const allFindings = agents.flatMap(a => a.findings);
        if (allFindings.length === 0) return '';

        let section = `## Consolidated Findings (${allFindings.length})\n\n`;

        // Group by severity
        for (const severity of ['critical', 'high', 'medium', 'low']) {
            const findings = allFindings.filter(f => f.severity === severity);
            if (findings.length === 0) continue;

            section += `### ${severity.toUpperCase()} (${findings.length})\n\n`;
            for (const finding of findings.slice(0, 10)) { // Top 10 per severity
                section += `- **${finding.category}**: ${finding.description}\n`;
                section += `  - Location: \`${finding.location}\`\n`;
                section += `  - Recommendation: ${finding.recommendation}\n\n`;
            }
        }

        return section;
    }

    private formatConsolidatedImprovements(agents: AgentState[]): string {
        const allImprovements = agents.flatMap(a => a.improvements);
        if (allImprovements.length === 0) return '';

        let section = `## Consolidated Improvements (${allImprovements.length})\n\n`;

        for (const improvement of allImprovements) {
            section += `### ${improvement.description}\n\n`;
            section += `- **Type**: ${improvement.type}\n`;
            section += `- **Files Modified**: ${improvement.filesModified.length}\n`;
            section += `- **Tests Added**: ${improvement.testsCovered.length}\n\n`;
        }

        return section;
    }

    private formatOverallMetrics(agents: AgentState[]): string {
        const allMetrics = agents.reduce((acc, agent) => {
            return { ...acc, ...agent.metrics };
        }, {});

        let section = `## Overall Metrics\n\n`;
        section += `\`\`\`json\n${JSON.stringify(allMetrics, null, 2)}\n\`\`\`\n\n`;
        return section;
    }

    private formatCleanupStatus(agents: AgentState[]): string {
        const totalTempFiles = agents.reduce((sum, a) => sum + a.temporaryFiles.length, 0);

        let section = `## Cleanup Status\n\n`;
        section += `- **Auto-cleanup enabled**: ✅\n`;
        section += `- **Temporary files remaining**: ${totalTempFiles}\n`;

        if (totalTempFiles > 0) {
            section += `\n> [!WARNING]\n`;
            section += `> ${totalTempFiles} temporary files still exist and will be cleaned up shortly.\n\n`;
        } else {
            section += `\n✓ All temporary files have been cleaned up.\n\n`;
        }

        return section;
    }

    private getStatusEmoji(status: string): string {
        const emojis: Record<string, string> = {
            completed: '✅',
            running: '🔄',
            pending: '⏳',
            failed: '❌',
            blocked: '🚫',
        };
        return emojis[status] || '❓';
    }

    private getAgentName(agentId: string): string {
        const names: Record<string, string> = {
            '00': 'Orchestrator Agent',
            '01': 'Backend Quality Agent',
            '02': 'Frontend Quality Agent',
            '03': 'Database Optimization Agent',
            '04': 'Security & Compliance Agent',
            '05': 'Performance Optimization Agent',
            '06': 'Infrastructure & DevOps Agent',
            '07': 'Documentation Quality Agent',
            '08': 'Testing & QA Agent',
            '09': 'Monitoring & Observability Agent',
            '10': 'Task Management Agent',
        };
        return names[agentId] || agentId;
    }

    private getAgentPriority(agentId: string): 'P0' | 'P1' | 'P2' {
        const priorities: Record<string, 'P0' | 'P1' | 'P2'> = {
            '00': 'P0',
            '04': 'P0',
            '10': 'P0',
            '01': 'P1',
            '02': 'P1',
            '03': 'P1',
            '05': 'P1',
            '08': 'P1',
            '06': 'P2',
            '07': 'P2',
            '09': 'P2',
        };
        return priorities[agentId] || 'P2';
    }

    async close(): Promise<void> {
        if (this.database) {
            await this.database.end();
        }
    }
}
