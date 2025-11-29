import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    OneToMany,
    JoinColumn,
    Index,
} from 'typeorm';
import { User } from './User';
import { Sprint } from './Sprint';
import { Project } from './Project';
import { Comment } from './Comment';
import { Attachment } from './Attachment';

export enum TaskType {
    EPIC = 'epic',
    STORY = 'story',
    TASK = 'task',
    SUBTASK = 'subtask',
    BUG = 'bug',
}

export enum TaskStatus {
    TODO = 'todo',
    IN_PROGRESS = 'in_progress',
    IN_REVIEW = 'in_review',
    DONE = 'done',
    BLOCKED = 'blocked',
}

export enum TaskPriority {
    CRITICAL = 'critical',
    HIGH = 'high',
    MEDIUM = 'medium',
    LOW = 'low',
}

@Entity('tasks')
export class Task {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({
        type: 'enum',
        enum: TaskType,
        default: TaskType.TASK,
    })
    type!: TaskType;

    @Column()
    title!: string;

    @Column({ type: 'text', nullable: true })
    description!: string;

    @Column({
        type: 'enum',
        enum: TaskStatus,
        default: TaskStatus.TODO,
    })
    @Index()
    status!: TaskStatus;

    @Column({
        type: 'enum',
        enum: TaskPriority,
        default: TaskPriority.MEDIUM,
    })
    @Index()
    priority!: TaskPriority;

    // Hierarchy
    @ManyToOne(() => Task, (task) => task.children, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'parentId' })
    parent!: Task;

    @Column({ nullable: true })
    parentId!: string;

    @OneToMany(() => Task, (task) => task.parent)
    children!: Task[];

    // Epic association (for stories/tasks)
    @ManyToOne(() => Task, { nullable: true })
    @JoinColumn({ name: 'epicId' })
    epic!: Task;

    @Column({ nullable: true })
    epicId!: string;

    // Assignment
    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'assigneeId' })
    assignee!: User;

    @Column({ nullable: true })
    assigneeId!: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'reporterId' })
    reporter!: User;

    @Column()
    reporterId!: string;

    // Project & Sprint
    @ManyToOne(() => Project, (project) => project.tasks, { nullable: true })
    @JoinColumn({ name: 'projectId' })
    project!: Project;

    @Column({ nullable: true })
    projectId!: string;

    @ManyToOne(() => Sprint, (sprint) => sprint.tasks, { nullable: true })
    @JoinColumn({ name: 'sprintId' })
    sprint!: Sprint;

    @Column({ nullable: true })
    sprintId!: string;

    // Estimation
    @Column({ type: 'float', nullable: true })
    points!: number;

    @Column({ type: 'int', nullable: true })
    estimatedHours!: number;

    @Column({ type: 'int', nullable: true })
    actualHours!: number;

    // Dates
    @Column({ type: 'timestamp', nullable: true })
    dueDate!: Date;

    @Column({ type: 'timestamp', nullable: true })
    startDate!: Date;

    @Column({ type: 'timestamp', nullable: true })
    completedAt!: Date;

    // Relations
    @OneToMany(() => Comment, (comment) => comment.task)
    comments!: Comment[];

    @OneToMany(() => Attachment, (attachment) => attachment.task)
    attachments!: Attachment[];

    // Metadata
    @Column('simple-array', { nullable: true })
    tags!: string[];

    @Column({ type: 'int', default: 0 })
    order!: number;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
