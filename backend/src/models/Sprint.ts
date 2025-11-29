import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Task } from './Task';
import { Project } from './Project';

export enum SprintStatus {
    PLANNED = 'planned',
    ACTIVE = 'active',
    COMPLETED = 'completed',
}

@Entity('sprints')
export class Sprint {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column()
    name!: string;

    @Column({ type: 'text', nullable: true })
    goal!: string;

    @Column({
        type: 'enum',
        enum: SprintStatus,
        default: SprintStatus.PLANNED,
    })
    status!: SprintStatus;

    @Column({ type: 'timestamp' })
    startDate!: Date;

    @Column({ type: 'timestamp' })
    endDate!: Date;

    @ManyToOne(() => Project, (project) => project.sprints, { nullable: true })
    @JoinColumn({ name: 'projectId' })
    project!: Project;

    @Column({ nullable: true })
    projectId!: string;

    @OneToMany(() => Task, (task) => task.sprint)
    tasks!: Task[];

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
