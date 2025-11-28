/**
 * Task Management Service
 * Core CRUD operations and business logic for task management
 */

import { Pool } from 'pg';
import {
  Task,
  CreateTaskDTO,
  UpdateTaskDTO,
  TaskFilters,
  PaginatedResponse,
  ValidationResult,
  TaskStatus,
  StateTransition,
  WorkLog,
} from '../types';

export class TaskService {
  constructor(private db: Pool) {}

  /**
   * Create a new task
   */
  async createTask(data: CreateTaskDTO, creatorId: string): Promise<Task> {
    // Validate task creation
    const validation = await this.validateTaskCreation(data);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
    }

    const query = `
      INSERT INTO tasks (
        type, title, description, status, priority,
        parent_id, assignee_id, team_id, reporter_id,
        estimate, time_estimate, start_date, due_date,
        labels, sprint_id, custom_fields
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *
    `;

    const values = [
      data.type,
      data.title,
      data.description,
      'backlog', // Default status
      data.priority,
      data.parentId,
      data.assigneeId,
      data.teamId,
      creatorId,
      data.estimate,
      data.timeEstimate,
      data.startDate,
      data.dueDate,
      data.labels || [],
      data.sprintId,
      data.customFields || {},
    ];

    const result = await this.db.query(query, values);
    const task = this.mapRowToTask(result.rows[0]);

    // Update hierarchy if parent exists
    if (data.parentId) {
      await this.updateHierarchy(task.id, data.parentId);
    }

    // Trigger events
    await this.onTaskCreated(task);

    return task;
  }

  /**
   * Get task by ID
   */
  async getTask(taskId: string): Promise<Task | null> {
    const query = `
      SELECT
        t.*,
        COALESCE(json_agg(DISTINCT td.*) FILTER (WHERE td.id IS NOT NULL), '[]') as dependencies,
        COALESCE(array_agg(DISTINCT c.id) FILTER (WHERE c.id IS NOT NULL), '{}') as child_ids
      FROM tasks t
      LEFT JOIN task_dependencies td ON t.id = td.task_id
      LEFT JOIN tasks c ON c.parent_id = t.id
      WHERE t.id = $1
      GROUP BY t.id
    `;

    const result = await this.db.query(query, [taskId]);
    if (result.rows.length === 0) return null;

    return this.mapRowToTask(result.rows[0]);
  }

  /**
   * Update task
   */
  async updateTask(taskId: string, updates: UpdateTaskDTO, userId: string): Promise<Task> {
    const existing = await this.getTask(taskId);
    if (!existing) {
      throw new Error(`Task ${taskId} not found`);
    }

    // Build dynamic update query
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (updates.title !== undefined) {
      fields.push(`title = $${paramCount++}`);
      values.push(updates.title);
    }
    if (updates.description !== undefined) {
      fields.push(`description = $${paramCount++}`);
      values.push(updates.description);
    }
    if (updates.priority !== undefined) {
      fields.push(`priority = $${paramCount++}`);
      values.push(updates.priority);
    }
    if (updates.assigneeId !== undefined) {
      fields.push(`assignee_id = $${paramCount++}`);
      values.push(updates.assigneeId);
    }
    if (updates.estimate !== undefined) {
      fields.push(`estimate = $${paramCount++}`);
      values.push(updates.estimate);
    }
    if (updates.timeEstimate !== undefined) {
      fields.push(`time_estimate = $${paramCount++}`);
      values.push(updates.timeEstimate);
    }
    if (updates.startDate !== undefined) {
      fields.push(`start_date = $${paramCount++}`);
      values.push(updates.startDate);
    }
    if (updates.dueDate !== undefined) {
      fields.push(`due_date = $${paramCount++}`);
      values.push(updates.dueDate);
    }
    if (updates.labels !== undefined) {
      fields.push(`labels = $${paramCount++}`);
      values.push(updates.labels);
    }
    if (updates.sprintId !== undefined) {
      fields.push(`sprint_id = $${paramCount++}`);
      values.push(updates.sprintId);
    }
    if (updates.customFields !== undefined) {
      fields.push(`custom_fields = $${paramCount++}`);
      values.push(updates.customFields);
    }

    // Always update timestamp
    fields.push(`updated_at = NOW()`);

    // Add task ID
    values.push(taskId);

    const query = `
      UPDATE tasks
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await this.db.query(query, values);
    const updated = this.mapRowToTask(result.rows[0]);

    // Handle status change separately (with workflow validation)
    if (updates.status && updates.status !== existing.status) {
      await this.transitionTask(taskId, updates.status, userId);
    }

    return updated;
  }

  /**
   * Delete task (soft delete or hard delete with cascade)
   */
  async deleteTask(taskId: string, hardDelete = false): Promise<void> {
    if (hardDelete) {
      // Check for dependencies
      const hasDependents = await this.hasDepend entTasks(taskId);
      if (hasDependents) {
        throw new Error('Cannot delete task with dependent tasks');
      }

      await this.db.query('DELETE FROM tasks WHERE id = $1', [taskId]);
    } else {
      // Soft delete
      await this.db.query(
        'UPDATE tasks SET status = $1, updated_at = NOW() WHERE id = $2',
        ['cancelled', taskId]
      );
    }
  }

  /**
   * List tasks with filters and pagination
   */
  async listTasks(
    filters: TaskFilters,
    page = 1,
    pageSize = 50
  ): Promise<PaginatedResponse<Task>> {
    const whereClauses: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    // Build WHERE clause from filters
    if (filters.type && filters.type.length > 0) {
      whereClauses.push(`type = ANY($${paramCount++})`);
      values.push(filters.type);
    }
    if (filters.status && filters.status.length > 0) {
      whereClauses.push(`status = ANY($${paramCount++})`);
      values.push(filters.status);
    }
    if (filters.priority && filters.priority.length > 0) {
      whereClauses.push(`priority = ANY($${paramCount++})`);
      values.push(filters.priority);
    }
    if (filters.assigneeId && filters.assigneeId.length > 0) {
      whereClauses.push(`assignee_id = ANY($${paramCount++})`);
      values.push(filters.assigneeId);
    }
    if (filters.teamId) {
      whereClauses.push(`team_id = $${paramCount++}`);
      values.push(filters.teamId);
    }
    if (filters.sprintId) {
      whereClauses.push(`sprint_id = $${paramCount++}`);
      values.push(filters.sprintId);
    }
    if (filters.labels && filters.labels.length > 0) {
      whereClauses.push(`labels && $${paramCount++}`);
      values.push(filters.labels);
    }
    if (filters.search) {
      whereClauses.push(`search_vector @@ plainto_tsquery('english', $${paramCount++})`);
      values.push(filters.search);
    }
    if (filters.createdAfter) {
      whereClauses.push(`created_at >= $${paramCount++}`);
      values.push(filters.createdAfter);
    }
    if (filters.createdBefore) {
      whereClauses.push(`created_at <= $${paramCount++}`);
      values.push(filters.createdBefore);
    }
    if (filters.dueAfter) {
      whereClauses.push(`due_date >= $${paramCount++}`);
      values.push(filters.dueAfter);
    }
    if (filters.dueBefore) {
      whereClauses.push(`due_date <= $${paramCount++}`);
      values.push(filters.dueBefore);
    }
    if (filters.isBlocked !== undefined) {
      whereClauses.push(`is_blocked = $${paramCount++}`);
      values.push(filters.isBlocked);
    }
    if (filters.isCriticalPath !== undefined) {
      whereClauses.push(`is_critical_path = $${paramCount++}`);
      values.push(filters.isCriticalPath);
    }

    const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Count total
    const countQuery = `SELECT COUNT(*) FROM tasks ${whereClause}`;
    const countResult = await this.db.query(countQuery, values);
    const total = parseInt(countResult.rows[0].count);

    // Fetch paginated results
    const offset = (page - 1) * pageSize;
    const query = `
      SELECT * FROM tasks
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramCount++} OFFSET $${paramCount++}
    `;
    values.push(pageSize, offset);

    const result = await this.db.query(query, values);
    const items = result.rows.map(row => this.mapRowToTask(row));

    return {
      items,
      total,
      page,
      pageSize,
      hasMore: offset + items.length < total,
    };
  }

  /**
   * Transition task to new status
   */
  async transitionTask(taskId: string, toStatus: TaskStatus, userId: string): Promise<Task> {
    const task = await this.getTask(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    // Validate transition (would integrate with workflow engine)
    const isValidTransition = await this.validateTransition(task, toStatus);
    if (!isValidTransition) {
      throw new Error(`Invalid transition from ${task.status} to ${toStatus}`);
    }

    const fromStatus = task.status;
    const transitionedAt = new Date();

    // Update task status
    await this.db.query(
      'UPDATE tasks SET status = $1, updated_at = $2 WHERE id = $3',
      [toStatus, transitionedAt, taskId]
    );

    // Record transition
    await this.recordStateTransition(taskId, fromStatus, toStatus, userId, transitionedAt);

    // Calculate time in previous state
    const timeInState = await this.calculateTimeInState(taskId, fromStatus);
    await this.updateTaskMetrics(taskId, fromStatus, timeInState);

    // Mark as completed if moving to done
    if (toStatus === 'done') {
      await this.markTaskCompleted(taskId, transitionedAt);
    }

    // Trigger workflow automations
    await this.triggerWorkflowAutomations(taskId, 'status_changed', {
      fromStatus,
      toStatus,
    });

    return await this.getTask(taskId) as Task;
  }

  /**
   * Assign task to user
   */
  async assignTask(taskId: string, assigneeId: string): Promise<Task> {
    await this.db.query(
      'UPDATE tasks SET assignee_id = $1, updated_at = NOW() WHERE id = $2',
      [assigneeId, taskId]
    );

    // Trigger notification
    await this.notifyTaskAssigned(taskId, assigneeId);

    return await this.getTask(taskId) as Task;
  }

  /**
   * Log work on task
   */
  async logWork(
    taskId: string,
    userId: string,
    timeSpent: number,
    description: string
  ): Promise<WorkLog> {
    const query = `
      INSERT INTO work_logs (task_id, user_id, time_spent, description, logged_at)
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING *
    `;

    const result = await this.db.query(query, [taskId, userId, timeSpent, description]);

    // Update actual time on task
    await this.db.query(
      'UPDATE tasks SET actual_time = actual_time + $1 WHERE id = $2',
      [timeSpent / 60, taskId] // Convert minutes to hours
    );

    return result.rows[0];
  }

  /**
   * Get task history (all state transitions)
   */
  async getTaskHistory(taskId: string): Promise<StateTransition[]> {
    const query = `
      SELECT * FROM task_state_transitions
      WHERE task_id = $1
      ORDER BY transitioned_at DESC
    `;

    const result = await this.db.query(query, [taskId]);
    return result.rows;
  }

  // ========================================================================
  // Private Helper Methods
  // ========================================================================

  private async validateTaskCreation(data: CreateTaskDTO): Promise<ValidationResult> {
    const errors: any[] = [];
    const warnings: any[] = [];

    if (!data.title || data.title.trim().length === 0) {
      errors.push({ field: 'title', message: 'Title is required', code: 'REQUIRED' });
    }

    if (data.title && data.title.length > 500) {
      errors.push({ field: 'title', message: 'Title too long (max 500 chars)', code: 'TOO_LONG' });
    }

    if (data.parentId) {
      const parent = await this.getTask(data.parentId);
      if (!parent) {
        errors.push({ field: 'parentId', message: 'Parent task not found', code: 'NOT_FOUND' });
      }
    }

    if (data.estimate && data.estimate > 100) {
      warnings.push({
        field: 'estimate',
        message: 'Large estimate detected (>100 points)',
        suggestion: 'Consider breaking down into smaller tasks',
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  private async validateTransition(task: Task, toStatus: TaskStatus): Promise<boolean> {
    // Basic validation - would be enhanced with workflow engine
    const allowedTransitions: Record<TaskStatus, TaskStatus[]> = {
      backlog: ['todo'],
      todo: ['in_progress', 'cancelled'],
      in_progress: ['code_review', 'blocked', 'todo'],
      code_review: ['qa', 'in_progress'],
      qa: ['staging', 'in_progress'],
      staging: ['done', 'qa'],
      done: [],
      blocked: ['todo', 'in_progress'],
      cancelled: [],
    };

    const allowed = allowedTransitions[task.status] || [];
    return allowed.includes(toStatus);
  }

  private async updateHierarchy(taskId: string, parentId: string): Promise<void> {
    // Add task to parent's children
    await this.db.query(
      `UPDATE tasks
       SET child_ids = array_append(child_ids, $1)
       WHERE id = $2`,
      [taskId, parentId]
    );
  }

  private async hasDependentTasks(taskId: string): Promise<boolean> {
    const result = await this.db.query(
      'SELECT COUNT(*) FROM task_dependencies WHERE depends_on_id = $1',
      [taskId]
    );
    return parseInt(result.rows[0].count) > 0;
  }

  private async recordStateTransition(
    taskId: string,
    fromStatus: TaskStatus,
    toStatus: TaskStatus,
    userId: string,
    transitionedAt: Date
  ): Promise<void> {
    await this.db.query(
      `INSERT INTO task_state_transitions
       (task_id, from_status, to_status, user_id, transitioned_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [taskId, fromStatus, toStatus, userId, transitionedAt]
    );
  }

  private async calculateTimeInState(taskId: string, status: TaskStatus): Promise<number> {
    const query = `
      SELECT transitioned_at
      FROM task_state_transitions
      WHERE task_id = $1 AND to_status = $2
      ORDER BY transitioned_at DESC
      LIMIT 1
    `;

    const result = await this.db.query(query, [taskId, status]);
    if (result.rows.length === 0) return 0;

    const enteredAt = new Date(result.rows[0].transitioned_at);
    const now = new Date();
    return Math.floor((now.getTime() - enteredAt.getTime()) / 1000); // Seconds
  }

  private async updateTaskMetrics(
    taskId: string,
    status: TaskStatus,
    timeInState: number
  ): Promise<void> {
    const metricField = this.getMetricFieldForStatus(status);
    if (metricField) {
      await this.db.query(
        `UPDATE tasks SET ${metricField} = $1 WHERE id = $2`,
        [timeInState, taskId]
      );
    }
  }

  private getMetricFieldForStatus(status: TaskStatus): string | null {
    const mapping: Record<string, string> = {
      code_review: 'code_review_time',
      qa: 'qa_time',
    };
    return mapping[status] || null;
  }

  private async markTaskCompleted(taskId: string, completedAt: Date): Promise<void> {
    // Calculate cycle time (TODO to DONE)
    const query = `
      SELECT transitioned_at
      FROM task_state_transitions
      WHERE task_id = $1 AND to_status = 'todo'
      ORDER BY transitioned_at ASC
      LIMIT 1
    `;

    const result = await this.db.query(query, [taskId]);
    let cycleTime = 0;

    if (result.rows.length > 0) {
      const startedAt = new Date(result.rows[0].transitioned_at);
      cycleTime = Math.floor((completedAt.getTime() - startedAt.getTime()) / 1000);
    }

    // Calculate lead time (CREATED to DONE)
    const taskResult = await this.db.query(
      'SELECT created_at FROM tasks WHERE id = $1',
      [taskId]
    );
    const createdAt = new Date(taskResult.rows[0].created_at);
    const leadTime = Math.floor((completedAt.getTime() - createdAt.getTime()) / 1000);

    await this.db.query(
      `UPDATE tasks
       SET completed_at = $1, cycle_time = $2, lead_time = $3
       WHERE id = $4`,
      [completedAt, cycleTime, leadTime, taskId]
    );
  }

  private mapRowToTask(row: any): Task {
    return {
      id: row.id,
      type: row.type,
      title: row.title,
      description: row.description,
      status: row.status,
      priority: row.priority,
      parentId: row.parent_id,
      childIds: row.child_ids || [],
      epicId: row.epic_id,
      path: [], // Would be calculated
      assigneeId: row.assignee_id,
      reporterId: row.reporter_id,
      teamId: row.team_id,
      watchers: [],
      estimate: row.estimate,
      timeEstimate: row.time_estimate,
      actualTime: row.actual_time || 0,
      remainingTime: row.remaining_time,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      startDate: row.start_date,
      dueDate: row.due_date,
      completedAt: row.completed_at,
      labels: row.labels || [],
      component: row.component,
      version: row.version,
      tags: [],
      sprintId: row.sprint_id,
      releaseId: row.release_id,
      milestoneId: row.milestone_id,
      dependencies: row.dependencies || [],
      blockedBy: [],
      blocking: [],
      relatedTasks: [],
      customFields: row.custom_fields || {},
      attachments: [],
      comments: [],
      cycleTime: row.cycle_time,
      leadTime: row.lead_time,
      codeReviewTime: row.code_review_time,
      qaTime: row.qa_time,
      isCriticalPath: row.is_critical_path || false,
      isBlocked: row.is_blocked || false,
      isOverdue: row.due_date && new Date(row.due_date) < new Date(),
      hasRisks: false,
    };
  }

  private async onTaskCreated(task: Task): Promise<void> {
    // Trigger workflow automations
    await this.triggerWorkflowAutomations(task.id, 'task_created', { task });
  }

  private async triggerWorkflowAutomations(
    taskId: string,
    event: string,
    data: any
  ): Promise<void> {
    // Would integrate with workflow engine
    // For now, just a placeholder
    console.log(`Workflow automation triggered: ${event} for task ${taskId}`);
  }

  private async notifyTaskAssigned(taskId: string, assigneeId: string): Promise<void> {
    // Would integrate with notification service
    console.log(`Notifying user ${assigneeId} of task ${taskId} assignment`);
  }
}
