import { Response, NextFunction } from 'express';
import { TaskService } from '../services/TaskService';
import { AuthenticatedRequest } from '../middleware/auth';
import { TaskStatus, TaskType } from '../models/Task';

const taskService = new TaskService();

export class TaskController {
    /**
     * Create a new task
     * POST /api/v1/tasks
     */
    async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            if (!req.user) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const task = await taskService.createTask(req.user.id, req.body);
            res.status(201).json(task);
        } catch (error) {
            next(error);
        }
    }

    /**
     * List tasks
     * GET /api/v1/tasks
     */
    async list(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 20;

            const filters = {
                projectId: req.query.projectId as string,
                sprintId: req.query.sprintId as string,
                assigneeId: req.query.assigneeId as string,
                status: req.query.status as TaskStatus,
                type: req.query.type as TaskType,
                search: req.query.search as string,
                epicId: req.query.epicId as string,
                parentId: req.query.parentId as string,
            };

            const result = await taskService.getTasks(filters, { page, limit });
            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get a single task
     * GET /api/v1/tasks/:id
     */
    async getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const task = await taskService.getTaskById(req.params.id);
            if (!task) {
                return res.status(404).json({ error: 'Task not found' });
            }
            res.json(task);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Update a task
     * PATCH /api/v1/tasks/:id
     */
    async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const task = await taskService.updateTask(req.params.id, req.body);
            if (!task) {
                return res.status(404).json({ error: 'Task not found' });
            }
            res.json(task);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Delete a task
     * DELETE /api/v1/tasks/:id
     */
    async delete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const success = await taskService.deleteTask(req.params.id);
            if (!success) {
                return res.status(404).json({ error: 'Task not found' });
            }
            res.json({ message: 'Task deleted successfully' });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Add a comment
     * POST /api/v1/tasks/:id/comments
     */
    async addComment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            if (!req.user) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
            const comment = await taskService.addComment(
                req.user.id,
                req.params.id,
                req.body.content
            );
            res.status(201).json(comment);
        } catch (error) {
            next(error);
        }
    }
}
