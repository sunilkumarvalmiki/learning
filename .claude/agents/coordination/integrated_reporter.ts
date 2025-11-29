/**
 * Integrated Reporter
 * 
 * Single unified reporting system that consolidates all agent outputs
 * without creating separate files. Queries database for agent states
 * and generates comprehensive markdown reports.
 */

import { Pool } from 'pg';
import { promises as fs } from 'fs';
import { join } from 'path';

export interface ReportConfig {
    includeMetrics: boolean;
    includeFindings: boolean;
    includeImprovements: boolean;
    maxFindingsPerSeverity: number;
    outputPath?: string;
    archiveOldReports: boolean;
    archiveAfterDays: number;
}

export interface ConsolidatedReport {
    executionId: string;
    generatedAt: Date;
    totalAgents: number;
    summary: ExecutionSummary;
    agentReports: AgentReport[];
    overallMetrics: Record<string, any>;
    recommendations: string[];
}

export interface ExecutionSummary {
    completed: number;
    running: number;
    failed: number;
    blocked: number;
    totalDuration: number; // minutes
    totalFindings: number;
    totalImprovements: number;
}

export interface AgentReport {
    agentId: string;
    name: string;
    priority: string;
    status: string;
    duration: number;
    findings: any[];
    improvements: any[];
    metrics: Record<string, any>;
}

export class IntegratedReporter {
    private database: Pool;
    private config: ReportConfig;

    constructor(databaseUrl: string, config: Partial<ReportConfig> = {}) {
        this.database = new Pool({
            connectionString: databaseUrl,
        });

        this.config = {
            includeMetrics: true,
            includeFindings: true,
            includeImprovements: true,
            maxFindingsPerSeverity: 10,
            archiveOldReports: true,
            archiveAfterDays: 30,
            ...config,
        };
    }

    /**
     * Generate consolidated report from database
     * No need for separate tracking files - everything from DB
     */
    async generateConsolidatedReport(executionId?: string): Promise<ConsolidatedReport> {
        // Get latest execution if not specified
        if (!executionId) {
            const result = await this.database.query(`
        SELECT DISTINCT execution_id 
        FROM agent_execution_states 
        ORDER BY created_at DESC 
        LIMIT 1
      `);

            if (result.rows.length === 0) {
                throw new Error('No agent executions found in database');
            }

            executionId = result.rows[0].execution_id;
        }

        // Fetch all agent states for this execution
        const agentStates = await this.database.query(`
      SELECT 
        agent_id, name, priority, status,
        start_time, end_time, progress,
        findings, improvements, metrics,
        temporary_files, errors
      FROM agent_execution_states
      WHERE execution_id = $1
      ORDER BY priority, agent_id
    `, [executionId]);

        // Build consolidated report
        const report: ConsolidatedReport = {
            executionId,
            generatedAt: new Date(),
            totalAgents: agentStates.rows.length,
            summary: this.calculateSummary(agentStates.rows),
            agentReports: this.buildAgentReports(agentStates.rows),
            overallMetrics: this.aggregateMetrics(agentStates.rows),
            recommendations: this.generateRecommendations(agentStates.rows),
        };

        return report;
    }

    private calculateSummary(agentStates: any[]): ExecutionSummary {
        const summary: ExecutionSummary = {
            completed: 0,
            running: 0,
            failed: 0,
            blocked: 0,
            totalDuration: 0,
            totalFindings: 0,
            totalImprovements: 0,
        };

        for (const agent of agentStates) {
            // Count status
            if (agent.status === 'completed') summary.completed++;
            else if (agent.status === 'running') summary.running++;
            else if (agent.status === 'failed') summary.failed++;
            else if (agent.status === 'blocked') summary.blocked++;

            // Calculate duration
            if (agent.start_time && agent.end_time) {
                const duration = (new Date(agent.end_time).getTime() - new Date(agent.start_time).getTime()) / 1000 / 60;
                summary.totalDuration += duration;
            }

            // Count findings and improvements
            summary.totalFindings += (agent.findings || []).length;
            summary.totalImprovements += (agent.improvements || []).length;
        }

        return summary;
    }

    private buildAgentReports(agentStates: any[]): AgentReport[] {
        return agentStates.map(agent => ({
            agentId: agent.agent_id,
            name: agent.name,
            priority: agent.priority,
            status: agent.status,
            duration: this.calculateDuration(agent.start_time, agent.end_time),
            findings: agent.findings || [],
            improvements: agent.improvements || [],
            metrics: agent.metrics || {},
        }));
    }

    private calculateDuration(start: Date, end: Date): number {
        if (!start || !end) return 0;
        return (new Date(end).getTime() - new Date(start).getTime()) / 1000 / 60;
    }

    private aggregateMetrics(agentStates: any[]): Record<string, any> {
        const aggregated: Record<string, any> = {};

        for (const agent of agentStates) {
            const metrics = agent.metrics || {};

            for (const [key, value] of Object.entries(metrics)) {
                if (typeof value === 'number') {
                    aggregated[key] = (aggregated[key] || 0) + value;
                } else if (!aggregated[key]) {
                    aggregated[key] = value;
                }
            }
        }

        return aggregated;
    }

    private generateRecommendations(agentStates: any[]): string[] {
        const recommendations: string[] = [];

        // Check for failed agents
        const failed = agentStates.filter(a => a.status === 'failed');
        if (failed.length > 0) {
            recommendations.push(`${failed.length} agent(s) failed - review errors and retry`);
        }

        // Check for blocked agents
        const blocked = agentStates.filter(a => a.status === 'blocked');
        if (blocked.length > 0) {
            recommendations.push(`${blocked.length} agent(s) blocked - resolve dependencies`);
        }

        // Check for critical findings
        const criticalFindings = agentStates
            .flatMap(a => a.findings || [])
            .filter((f: any) => f.severity === 'critical');

        if (criticalFindings.length > 0) {
            recommendations.push(`${criticalFindings.length} critical findings require immediate attention`);
        }

        return recommendations;
    }

    /**
     * Format report as markdown
     */
    async formatAsMarkdown(report: ConsolidatedReport): Promise<string> {
        let md = `# Claude Agents - Consolidated Execution Report\n\n`;
        md += `**Execution ID**: \`${report.executionId}\`\n`;
        md += `**Generated**: ${report.generatedAt.toISOString()}\n`;
        md += `**Total Agents**: ${report.totalAgents}\n\n`;

        // Executive Summary
        md += `## Executive Summary\n\n`;
        md += `- ✅ **Completed**: ${report.summary.completed}\n`;
        md += `- 🔄 **Running**: ${report.summary.running}\n`;
        md += `- ❌ **Failed**: ${report.summary.failed}\n`;
        md += `- 🚫 **Blocked**: ${report.summary.blocked}\n`;
        md += `- ⏱️  **Total Duration**: ${report.summary.totalDuration.toFixed(2)} minutes\n`;
        md += `- 🔍 **Total Findings**: ${report.summary.totalFindings}\n`;
        md += `- 🚀 **Total Improvements**: ${report.summary.totalImprovements}\n\n`;

        // Recommendations
        if (report.recommendations.length > 0) {
            md += `> [!IMPORTANT]\n`;
            md += `> **Action Required**:\n`;
            for (const rec of report.recommendations) {
                md += `> - ${rec}\n`;
            }
            md += `\n`;
        }

        // Agent Reports by Priority
        for (const priority of ['P0', 'P1', 'P2']) {
            const agents = report.agentReports.filter(a => a.priority === priority);
            if (agents.length === 0) continue;

            md += `## Priority ${priority} Agents\n\n`;

            for (const agent of agents) {
                md += this.formatAgentSection(agent);
            }
        }

        // Overall Metrics
        if (this.config.includeMetrics && Object.keys(report.overallMetrics).length > 0) {
            md += `## Overall Metrics\n\n`;
            md += '```json\n';
            md += JSON.stringify(report.overallMetrics, null, 2);
            md += '\n```\n\n';
        }

        return md;
    }

    private formatAgentSection(agent: AgentReport): string {
        let section = `### ${agent.name}\n\n`;
        section += `- **Status**: ${this.getStatusBadge(agent.status)}\n`;
        section += `- **Progress**: ${agent.status === 'completed' ? '100' : '?'}%\n`;
        section += `- **Duration**: ${agent.duration.toFixed(2)} minutes\n`;

        if (this.config.includeFindings) {
            section += `- **Findings**: ${agent.findings.length}\n`;
            if (agent.findings.length > 0) {
                section += this.formatFindings(agent.findings);
            }
        }

        if (this.config.includeImprovements) {
            section += `- **Improvements**: ${agent.improvements.length}\n`;
            if (agent.improvements.length > 0) {
                section += this.formatImprovements(agent.improvements);
            }
        }

        section += '\n';
        return section;
    }

    private formatFindings(findings: any[]): string {
        let output = '\n\n#### Key Findings\n\n';

        // Group by severity
        for (const severity of ['critical', 'high', 'medium', 'low']) {
            const severityFindings = findings.filter(f => f.severity === severity);
            if (severityFindings.length === 0) continue;

            output += `**${severity.toUpperCase()}** (${severityFindings.length}):\n`;
            const displayCount = Math.min(severityFindings.length, this.config.maxFindingsPerSeverity);

            for (let i = 0; i < displayCount; i++) {
                const finding = severityFindings[i];
                output += `- ${finding.description} (\`${finding.location}\`)\n`;
            }

            if (severityFindings.length > displayCount) {
                output += `- ...and ${severityFindings.length - displayCount} more\n`;
            }
            output += '\n';
        }

        return output;
    }

    private formatImprovements(improvements: any[]): string {
        let output = '\n\n#### Improvements Made\n\n';

        for (const improvement of improvements) {
            output += `- **${improvement.description}**\n`;
            output += `  - Type: ${improvement.type}\n`;
            output += `  - Files: ${improvement.filesModified?.length || 0}\n`;
            output += `  - Tests: ${improvement.testsCovered?.length || 0}\n\n`;
        }

        return output;
    }

    private getStatusBadge(status: string): string {
        const badges: Record<string, string> = {
            completed: '✅ COMPLETED',
            running: '🔄 RUNNING',
            pending: '⏳ PENDING',
            failed: '❌ FAILED',
            blocked: '🚫 BLOCKED',
        };
        return badges[status] || status.toUpperCase();
    }

    /**
     * Save report to file system
     */
    async saveReport(report: ConsolidatedReport, outputPath?: string): Promise<string> {
        const markdown = await this.formatAsMarkdown(report);
        const timestamp = new Date().toISOString().split('T')[0];

        const path = outputPath || this.config.outputPath ||
            join(process.cwd(), '.claude/agents/reports', `consolidated-${timestamp}.md`);

        await fs.mkdir(join(path, '..'), { recursive: true });
        await fs.writeFile(path, markdown);

        console.log(`\n✓ Report saved: ${path}`);
        return path;
    }

    /**
     * Archive old reports
     */
    async archiveOldReports(): Promise<number> {
        if (!this.config.archiveOldReports) {
            return 0;
        }

        const archivePath = join(process.cwd(), '.claude/agents/reports/archive');
        await fs.mkdir(archivePath, { recursive: true });

        const reportsDir = join(process.cwd(), '.claude/agents/reports');
        const files = await fs.readdir(reportsDir);

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - this.config.archiveAfterDays);

        let archivedCount = 0;

        for (const file of files) {
            if (!file.endsWith('.md') || file.startsWith('consolidated-')) continue;

            const filePath = join(reportsDir, file);
            const stats = await fs.stat(filePath);

            if (stats.mtime < cutoffDate) {
                await fs.rename(filePath, join(archivePath, file));
                archivedCount++;
            }
        }

        if (archivedCount > 0) {
            console.log(`✓ Archived ${archivedCount} old reports`);
        }

        return archivedCount;
    }

    async close(): Promise<void> {
        await this.database.end();
    }
}
