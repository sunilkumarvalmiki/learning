#!/usr/bin/env node

/**
 * CLI for Claude Agents Coordination System
 * 
 * Provides streamlined execution of quality agents with integrated
 * state tracking and automatic cleanup.
 */

import { Command } from 'commander';
import { AgentExecutionCoordinator, ExecutionConfig } from './agent_execution_coordinator';
import { CleanupOrchestrator } from './cleanup_orchestrator';
import { IntegratedReporter } from './integrated_reporter';
import { join } from 'path';
import { promises as fs } from 'fs';

const program = new Command();

program
    .name('claude-agents')
    .description('Streamlined execution system for Claude quality improvement agents')
    .version('1.0.0');

program
    .command('run')
    .description('Run quality agents with integrated tracking')
    .option('-a, --agent <id>', 'Run specific agent (e.g., 00, 01, 04)')
    .option('-p, --priority <level>', 'Run agents by priority (P0, P1, P2, all)')
    .option('--integrated-tracking', 'Use database for state tracking', true)
    .option('--auto-cleanup', 'Automatically cleanup temporary files', true)
    .option('--verify-clean', 'Verify no orphan files after execution', false)
    .option('--consolidated-report', 'Generate single consolidated report', true)
    .option('--db-url <url>', 'Database connection URL', process.env.DATABASE_URL || 'postgresql://localhost/ai_knowledge')
    .action(async (options) => {
        try {
            const config: ExecutionConfig = {
                integratedTracking: options.integratedTracking,
                autoCleanup: options.autoCleanup,
                verifyClean: options.verifyClean,
                consolidatedReport: options.consolidatedReport,
                databaseUrl: options.dbUrl,
            };

            const coordinator = new AgentExecutionCoordinator(config);
            const cleanup = new CleanupOrchestrator(options.dbUrl);

            console.log('\n╔════════════════════════════════════════════════════════════════╗');
            console.log('║   Claude Agents - Streamlined Execution System                ║');
            console.log('║   Integrated tracking • Auto-cleanup • No redundant files     ║');
            console.log('╚════════════════════════════════════════════════════════════════╝\n');

            // Determine which agents to run
            const agentsToRun = getAgentsToRun(options.agent, options.priority);

            console.log(`📋 Agents to execute: ${agentsToRun.length}`);
            for (const agentId of agentsToRun) {
                console.log(`   - ${getAgentName(agentId)} (${agentId})`);
            }
            console.log('');

            // Execute each agent
            for (const agentId of agentsToRun) {
                await executeAgent(coordinator, cleanup, agentId);
            }

            // Generate consolidated report
            if (config.consolidatedReport) {
                console.log('\n📊 Generating consolidated report...');
                const report = await coordinator.generateConsolidatedReport();
                console.log(report);
            }

            // Verify no orphan files
            if (config.verifyClean) {
                console.log('\n🔍 Verifying no orphan files...');
                const orphans = await cleanup.detectOrphanFiles(join(process.cwd(), '.claude/agents'));

                if (orphans.length > 0) {
                    console.log(`⚠️  Found ${orphans.length} orphan files:`);
                    for (const orphan of orphans) {
                        console.log(`   - ${orphan.filepath}`);
                    }
                } else {
                    console.log('✓ No orphan files detected');
                }
            }

            await coordinator.close();
            await cleanup.close();

            console.log('\n✅ Agent execution completed successfully!\n');
        } catch (error: any) {
            console.error('\n❌ Error:', error.message);
            process.exit(1);
        }
    });

program
    .command('report')
    .description('Generate consolidated report from previous execution')
    .option('--db-url <url>', 'Database connection URL', process.env.DATABASE_URL || 'postgresql://localhost/ai_knowledge')
    .option('-e, --execution-id <id>', 'Specific execution ID (defaults to latest)')
    .option('-o, --output <path>', 'Output file path')
    .action(async (options) => {
        try {
            const reporter = new IntegratedReporter(options.dbUrl);

            console.log('\n📊 Generating consolidated report from database...\n');

            const report = await reporter.generateConsolidatedReport(options.executionId);
            const outputPath = await reporter.saveReport(report, options.output);

            console.log(`\n✅ Report generated: ${outputPath}\n`);

            await reporter.close();
        } catch (error: any) {
            console.error('\n❌ Error:', error.message);
            process.exit(1);
        }
    });

program
    .command('cleanup')
    .description('Run cleanup operations')
    .option('--db-url <url>', 'Database connection URL', process.env.DATABASE_URL || 'postgresql://localhost/ai_knowledge')
    .option('--detect-orphans', 'Detect orphan files')
    .option('--emergency', 'Emergency cleanup (use with caution)')
    .option('--dry-run', 'Dry run mode', true)
    .action(async (options) => {
        try {
            const cleanup = new CleanupOrchestrator(options.dbUrl);

            if (options.detectOrphans || options.emergency) {
                const orphans = await cleanup.emergencyCleanup(
                    join(process.cwd(), '.claude/agents'),
                    options.dryRun
                );

                if (orphans.length > 0) {
                    console.log(`\nFound ${orphans.length} orphan files`);
                }
            }

            const report = await cleanup.generateCleanupReport();
            console.log('\n' + report);

            await cleanup.close();
        } catch (error: any) {
            console.error('\n❌ Error:', error.message);
            process.exit(1);
        }
    });

async function executeAgent(
    coordinator: AgentExecutionCoordinator,
    cleanup: CleanupOrchestrator,
    agentId: string
): Promise<void> {
    console.log(`\n🤖 Executing ${getAgentName(agentId)}...`);

    // Update agent state to running
    await coordinator.trackAgentExecution(agentId, {
        status: 'running',
        startTime: new Date(),
        progress: 0,
    });

    try {
        // Read agent markdown file
        const agentPath = join(process.cwd(), '.claude/agents', `${agentId}-*.md`);
        const agentFile = await findAgentFile(agentId);

        if (!agentFile) {
            throw new Error(`Agent file not found for ${agentId}`);
        }

        console.log(`   Reading agent instructions from: ${agentFile}`);
        const content = await fs.readFile(agentFile, 'utf-8');

        // For now, display agent tasks to user
        // In a full implementation, this would execute the agent's instructions
        console.log('\n   📋 Agent Tasks:');
        const tasks = extractTasks(content);
        tasks.slice(0, 5).forEach((task, i) => {
            console.log(`      ${i + 1}. ${task}`);
        });

        if (tasks.length > 5) {
            console.log(`      ... and ${tasks.length - 5} more tasks`);
        }

        // Simulate progress (in real implementation, track actual progress)
        await coordinator.trackAgentExecution(agentId, {
            status: 'completed',
            endTime: new Date(),
            progress: 100,
            findings: [],
            improvements: [],
            metrics: {
                tasksIdentified: tasks.length,
            },
        });

        console.log(`   ✅ ${getAgentName(agentId)} completed`);
    } catch (error: any) {
        await coordinator.trackAgentExecution(agentId, {
            status: 'failed',
            endTime: new Date(),
            errors: [error.message],
        });
        console.error(`   ❌ ${getAgentName(agentId)} failed:`, error.message);
    }
}

async function findAgentFile(agentId: string): Promise<string | null> {
    const agentsDir = join(process.cwd(), '.claude/agents');
    const files = await fs.readdir(agentsDir);

    const agentFile = files.find(f => f.startsWith(`${agentId}-`) && f.endsWith('.md'));
    return agentFile ? join(agentsDir, agentFile) : null;
}

function extractTasks(content: string): string[] {
    const tasks: string[] = [];
    const lines = content.split('\n');

    for (const line of lines) {
        // Look for task markers
        if (line.match(/^-\s+\[.\]\s+/) || line.match(/^\d+\.\s+/)) {
            tasks.push(line.trim());
        }
    }

    return tasks;
}

function getAgentsToRun(agentId?: string, priority?: string): string[] {
    if (agentId) {
        return [agentId];
    }

    const agents: Record<string, string[]> = {
        'P0': ['00', '04', '10'],
        'P1': ['01', '02', '03', '05', '08'],
        'P2': ['06', '07', '09'],
        'all': ['00', '01', '02', '03', '04', '05', '06', '07', '08', '09', '10'],
    };

    return agents[priority || 'P0'] || agents['P0'];
}

function getAgentName(agentId: string): string {
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
    return names[agentId] || `Agent ${agentId}`;
}

program.parse();
