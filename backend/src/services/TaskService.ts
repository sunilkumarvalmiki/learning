import { AppDataSource } from '../config/database';
import { Task, TaskStatus, TaskType } from '../models/Task';
import { Sprint } from '../models/Sprint';
import { Project } from '../models/Project';
import { User } from '../models/User';
import { Comment } from '../models/Comment';
import { Attachment } from '../models/Attachment';
import { Brackets, IsNull, Not } from 'typeorm';

export class TaskService {
    private taskRepository = AppDataSource.getRepository(Task);
    private sprintRepository = AppDataSource.getRepository(Sprint);
    private projectRepository = AppDataSource.getRepository(Project);
    private commentRepository = AppDataSource.getRepository(Comment);
    private attachmentRepository = AppDataSource.getRepository(Attachment);

    /**
     * Create a new task
     */
    async createTask(
        userId: string,
        data: {
            title: string;
            type: TaskType;
            description?: string;
            projectId?: string;
            sprintId?: string;
            assigneeId?: string;
            parentId?: string;
            epicId?: string;
            points?: number;
            priority?: any;
            dueDate?: Date;
        }
    ): Promise<Task> {
        const task = this.taskRepository.create({
            ...data,
            reporterId: userId,
            status: TaskStatus.TODO,
        });

        // Auto-assign order (add to bottom)
        const maxOrder = await this.taskRepository
            .createQueryBuilder('task')
            .select('MAX(task.order)', 'max')
            .where('task.status = :status', { status: TaskStatus.TODO })
            .getRawOne();

        task.order = (maxOrder?.max || 0) + 1;

        return await this.taskRepository.save(task);
    }

    /**
     * Get tasks with filtering and pagination
     */
    async getTasks(
        filters: {
            projectId?: string;
            sprintId?: string;
            assigneeId?: string;
            status?: TaskStatus;
            type?: TaskType;
            search?: string;
            epicId?: string;
            parentId?: string;
        },
        pagination: { page: number; limit: number }
    ) {
        const query = this.taskRepository.createQueryBuilder('task')
            .leftJoinAndSelect('task.assignee', 'assignee')
            .leftJoinAndSelect('task.reporter', 'reporter')
            .leftJoinAndSelect('task.project', 'project')
            .leftJoinAndSelect('task.sprint', 'sprint')
            .leftJoinAndSelect('task.epic', 'epic')
            .orderBy('task.order', 'ASC')
            .addOrderBy('task.createdAt', 'DESC');

        if (filters.projectId) {
            query.andWhere('task.projectId = :projectId', { projectId: filters.projectId });
        }

        if (filters.sprintId) {
            query.andWhere('task.sprintId = :sprintId', { sprintId: filters.sprintId });
        }

        if (filters.assigneeId) {
            query.andWhere('task.assigneeId = :assigneeId', { assigneeId: filters.assigneeId });
        }

        if (filters.status) {
            query.andWhere('task.status = :status', { status: filters.status });
        }

        if (filters.type) {
            query.andWhere('task.type = :type', { type: filters.type });
        }

        if (filters.epicId) {
            query.andWhere('task.epicId = :epicId', { epicId: filters.epicId });
        }

        if (filters.parentId) {
            query.andWhere('task.parentId = :parentId', { parentId: filters.parentId });
        }

        if (filters.search) {
            query.andWhere(
                new Brackets((qb) => {
                    qb.where('task.title ILIKE :search', { search: `%${filters.search}%` })
                        .orWhere('task.description ILIKE :search', { search: `%${filters.search}%` });
                })
            );
        }

        const [tasks, total] = await query
            .skip((pagination.page - 1) * pagination.limit)
            .take(pagination.limit)
            .getManyAndCount();

        return {
            tasks,
            total,
            page: pagination.page,
            totalPages: Math.ceil(total / pagination.limit),
        };
    }

    /**
     * Get a single task by ID
     */
    async getTaskById(id: string): Promise<Task | null> {
        return await this.taskRepository.findOne({
            where: { id },
            relations: [
                'assignee',
                'reporter',
                'project',
                'sprint',
                'epic',
                'parent',
                'children',
                'comments',
                'comments.author',
                'attachments',
                'attachments.uploader'
            ],
            order: {
                comments: { createdAt: 'ASC' }
            }
        });
    }

    /**
     * Update a task
     */
    async updateTask(id: string, updates: Partial<Task>): Promise<Task | null> {
        const task = await this.taskRepository.findOneBy({ id });
        if (!task) return null;

        // Handle status change logic (e.g., setting completedAt)
        if (updates.status === TaskStatus.DONE && task.status !== TaskStatus.DONE) {
            updates.completedAt = new Date();
        } else if (updates.status && updates.status !== TaskStatus.DONE) {
            updates.completedAt = null as any; // Clear completedAt
        }

        Object.assign(task, updates);
        return await this.taskRepository.save(task);
    }

    /**
     * Delete a task
     */
    async deleteTask(id: string): Promise<boolean> {
        const result = await this.taskRepository.delete(id);
        return result.affected ? result.affected > 0 : false;
    }

    /**
     * Add a comment to a task
     */
    async addComment(userId: string, taskId: string, content: string): Promise<Comment> {
        const comment = this.commentRepository.create({
            content,
            authorId: userId,
            taskId,
        });
        return await this.commentRepository.save(comment);
    }

    /**
     * Get sprints for a project
     */
    async getSprints(projectId: string): Promise<Sprint[]> {
        return await this.sprintRepository.find({
            where: { projectId },
            order: { startDate: 'DESC' },
        });
    }

    /**
     * Create a sprint
     */
    async createSprint(data: Partial<Sprint>): Promise<Sprint> {
        const sprint = this.sprintRepository.create(data);
        return await this.sprintRepository.save(sprint);
    }
}
