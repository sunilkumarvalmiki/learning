import { TaskService } from '../../services/TaskService';
import { Task, TaskStatus, TaskType } from '../../models/Task';
import { AppDataSource } from '../../config/database';

// Mock the database
jest.mock('../../config/database', () => ({
    AppDataSource: {
        getRepository: jest.fn(),
    },
}));

describe('TaskService', () => {
    let taskService: TaskService;
    let mockTaskRepository: any;
    let mockSprintRepository: any;
    let mockProjectRepository: any;
    let mockCommentRepository: any;
    let mockAttachmentRepository: any;
    let mockQueryBuilder: any;

    beforeEach(() => {
        jest.clearAllMocks();

        // Mock query builder
        mockQueryBuilder = {
            leftJoinAndSelect: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockReturnThis(),
            addOrderBy: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            orWhere: jest.fn().mockReturnThis(),
            skip: jest.fn().mockReturnThis(),
            take: jest.fn().mockReturnThis(),
            getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
            select: jest.fn().mockReturnThis(),
            getRawOne: jest.fn().mockResolvedValue({ max: 0 }),
        };

        // Mock repositories
        mockTaskRepository = {
            create: jest.fn((data) => ({ ...data, id: 'task-123' })),
            save: jest.fn((task) => Promise.resolve(task)),
            findOne: jest.fn(),
            findOneBy: jest.fn(),
            delete: jest.fn(),
            createQueryBuilder: jest.fn(() => mockQueryBuilder),
        };

        mockSprintRepository = {
            create: jest.fn((data) => ({ ...data, id: 'sprint-123' })),
            save: jest.fn((sprint) => Promise.resolve(sprint)),
            find: jest.fn(),
        };

        mockProjectRepository = {
            findOne: jest.fn(),
        };

        mockCommentRepository = {
            create: jest.fn((data) => ({ ...data, id: 'comment-123' })),
            save: jest.fn((comment) => Promise.resolve(comment)),
        };

        mockAttachmentRepository = {
            find: jest.fn(),
        };

        // Setup getRepository mock
        (AppDataSource.getRepository as jest.Mock).mockImplementation((entity: any) => {
            const entityName = typeof entity === 'function' ? entity.name : entity;
            switch (entityName) {
                case 'Task':
                    return mockTaskRepository;
                case 'Sprint':
                    return mockSprintRepository;
                case 'Project':
                    return mockProjectRepository;
                case 'Comment':
                    return mockCommentRepository;
                case 'Attachment':
                    return mockAttachmentRepository;
                default:
                    return mockTaskRepository;
            }
        });

        taskService = new TaskService();
    });

    describe('createTask', () => {
        it('should create a new task with required fields', async () => {
            const userId = 'user-123';
            const taskData = {
                title: 'Test Task',
                type: TaskType.TASK,
            };

            const result = await taskService.createTask(userId, taskData);

            expect(mockTaskRepository.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: 'Test Task',
                    type: TaskType.TASK,
                    reporterId: userId,
                    status: TaskStatus.TODO,
                })
            );
            expect(mockTaskRepository.save).toHaveBeenCalled();
            expect(result).toHaveProperty('id');
        });

        it('should create a task with all optional fields', async () => {
            const userId = 'user-123';
            const taskData = {
                title: 'Complete Task',
                type: TaskType.STORY,
                description: 'Task description',
                projectId: 'project-123',
                sprintId: 'sprint-123',
                assigneeId: 'assignee-123',
                points: 5,
                priority: 1,
                dueDate: new Date('2024-12-31'),
            };

            const result = await taskService.createTask(userId, taskData);

            expect(mockTaskRepository.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: 'Complete Task',
                    type: TaskType.STORY,
                    description: 'Task description',
                    projectId: 'project-123',
                    sprintId: 'sprint-123',
                    assigneeId: 'assignee-123',
                    points: 5,
                })
            );
        });

        it('should auto-assign order when creating task', async () => {
            mockQueryBuilder.getRawOne.mockResolvedValue({ max: 5 });

            const userId = 'user-123';
            const taskData = {
                title: 'Ordered Task',
                type: TaskType.TASK,
            };

            await taskService.createTask(userId, taskData);

            // The order should be max + 1
            expect(mockTaskRepository.save).toHaveBeenCalledWith(
                expect.objectContaining({
                    order: 6,
                })
            );
        });

        it('should handle null max order', async () => {
            mockQueryBuilder.getRawOne.mockResolvedValue({ max: null });

            const userId = 'user-123';
            const taskData = {
                title: 'First Task',
                type: TaskType.TASK,
            };

            await taskService.createTask(userId, taskData);

            expect(mockTaskRepository.save).toHaveBeenCalledWith(
                expect.objectContaining({
                    order: 1,
                })
            );
        });
    });

    describe('getTasks', () => {
        it('should get tasks with pagination', async () => {
            const mockTasks = [
                { id: '1', title: 'Task 1' },
                { id: '2', title: 'Task 2' },
            ];
            mockQueryBuilder.getManyAndCount.mockResolvedValue([mockTasks, 2]);

            const result = await taskService.getTasks(
                {},
                { page: 1, limit: 10 }
            );

            expect(result.tasks).toEqual(mockTasks);
            expect(result.total).toBe(2);
            expect(result.page).toBe(1);
            expect(result.totalPages).toBe(1);
        });

        it('should filter by project', async () => {
            await taskService.getTasks(
                { projectId: 'project-123' },
                { page: 1, limit: 10 }
            );

            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
                'task.projectId = :projectId',
                { projectId: 'project-123' }
            );
        });

        it('should filter by sprint', async () => {
            await taskService.getTasks(
                { sprintId: 'sprint-123' },
                { page: 1, limit: 10 }
            );

            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
                'task.sprintId = :sprintId',
                { sprintId: 'sprint-123' }
            );
        });

        it('should filter by assignee', async () => {
            await taskService.getTasks(
                { assigneeId: 'user-123' },
                { page: 1, limit: 10 }
            );

            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
                'task.assigneeId = :assigneeId',
                { assigneeId: 'user-123' }
            );
        });

        it('should filter by status', async () => {
            await taskService.getTasks(
                { status: TaskStatus.IN_PROGRESS },
                { page: 1, limit: 10 }
            );

            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
                'task.status = :status',
                { status: TaskStatus.IN_PROGRESS }
            );
        });

        it('should filter by type', async () => {
            await taskService.getTasks(
                { type: TaskType.BUG },
                { page: 1, limit: 10 }
            );

            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
                'task.type = :type',
                { type: TaskType.BUG }
            );
        });

        it('should search in title and description', async () => {
            await taskService.getTasks(
                { search: 'test query' },
                { page: 1, limit: 10 }
            );

            expect(mockQueryBuilder.andWhere).toHaveBeenCalled();
        });

        it('should calculate correct total pages', async () => {
            mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 25]);

            const result = await taskService.getTasks(
                {},
                { page: 1, limit: 10 }
            );

            expect(result.totalPages).toBe(3);
        });

        it('should handle multiple filters', async () => {
            await taskService.getTasks(
                {
                    projectId: 'project-123',
                    status: TaskStatus.TODO,
                    assigneeId: 'user-123',
                },
                { page: 1, limit: 10 }
            );

            expect(mockQueryBuilder.andWhere).toHaveBeenCalledTimes(3);
        });
    });

    describe('getTaskById', () => {
        it('should get task with all relations', async () => {
            const mockTask = {
                id: 'task-123',
                title: 'Test Task',
                assignee: { id: 'user-1' },
                comments: [],
            };
            mockTaskRepository.findOne.mockResolvedValue(mockTask);

            const result = await taskService.getTaskById('task-123');

            expect(result).toEqual(mockTask);
            expect(mockTaskRepository.findOne).toHaveBeenCalledWith({
                where: { id: 'task-123' },
                relations: expect.arrayContaining([
                    'assignee',
                    'reporter',
                    'project',
                    'sprint',
                    'comments',
                ]),
                order: expect.any(Object),
            });
        });

        it('should return null for non-existent task', async () => {
            mockTaskRepository.findOne.mockResolvedValue(null);

            const result = await taskService.getTaskById('non-existent');

            expect(result).toBeNull();
        });
    });

    describe('updateTask', () => {
        it('should update task fields', async () => {
            const existingTask = {
                id: 'task-123',
                title: 'Old Title',
                status: TaskStatus.TODO,
            };
            mockTaskRepository.findOneBy.mockResolvedValue(existingTask);

            const result = await taskService.updateTask('task-123', {
                title: 'New Title',
            });

            expect(mockTaskRepository.save).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: 'New Title',
                })
            );
        });

        it('should set completedAt when status changes to DONE', async () => {
            const existingTask = {
                id: 'task-123',
                status: TaskStatus.IN_PROGRESS,
            };
            mockTaskRepository.findOneBy.mockResolvedValue(existingTask);

            await taskService.updateTask('task-123', {
                status: TaskStatus.DONE,
            });

            expect(mockTaskRepository.save).toHaveBeenCalledWith(
                expect.objectContaining({
                    status: TaskStatus.DONE,
                    completedAt: expect.any(Date),
                })
            );
        });

        it('should clear completedAt when status changes from DONE', async () => {
            const existingTask = {
                id: 'task-123',
                status: TaskStatus.DONE,
                completedAt: new Date(),
            };
            mockTaskRepository.findOneBy.mockResolvedValue(existingTask);

            await taskService.updateTask('task-123', {
                status: TaskStatus.IN_PROGRESS,
            });

            expect(mockTaskRepository.save).toHaveBeenCalledWith(
                expect.objectContaining({
                    completedAt: null,
                })
            );
        });

        it('should return null for non-existent task', async () => {
            mockTaskRepository.findOneBy.mockResolvedValue(null);

            const result = await taskService.updateTask('non-existent', {
                title: 'New Title',
            });

            expect(result).toBeNull();
        });
    });

    describe('deleteTask', () => {
        it('should delete task and return true', async () => {
            mockTaskRepository.delete.mockResolvedValue({ affected: 1 });

            const result = await taskService.deleteTask('task-123');

            expect(result).toBe(true);
            expect(mockTaskRepository.delete).toHaveBeenCalledWith('task-123');
        });

        it('should return false when task not found', async () => {
            mockTaskRepository.delete.mockResolvedValue({ affected: 0 });

            const result = await taskService.deleteTask('non-existent');

            expect(result).toBe(false);
        });
    });

    describe('addComment', () => {
        it('should create and save comment', async () => {
            const userId = 'user-123';
            const taskId = 'task-123';
            const content = 'This is a comment';

            const result = await taskService.addComment(userId, taskId, content);

            expect(mockCommentRepository.create).toHaveBeenCalledWith({
                content,
                authorId: userId,
                taskId,
            });
            expect(mockCommentRepository.save).toHaveBeenCalled();
        });
    });

    describe('getSprints', () => {
        it('should get sprints for a project', async () => {
            const mockSprints = [
                { id: 'sprint-1', name: 'Sprint 1' },
                { id: 'sprint-2', name: 'Sprint 2' },
            ];
            mockSprintRepository.find.mockResolvedValue(mockSprints);

            const result = await taskService.getSprints('project-123');

            expect(result).toEqual(mockSprints);
            expect(mockSprintRepository.find).toHaveBeenCalledWith({
                where: { projectId: 'project-123' },
                order: { startDate: 'DESC' },
            });
        });
    });

    describe('createSprint', () => {
        it('should create and save sprint', async () => {
            const sprintData = {
                name: 'New Sprint',
                startDate: new Date(),
                endDate: new Date(),
                projectId: 'project-123',
            };

            const result = await taskService.createSprint(sprintData);

            expect(mockSprintRepository.create).toHaveBeenCalledWith(sprintData);
            expect(mockSprintRepository.save).toHaveBeenCalled();
        });
    });
});
