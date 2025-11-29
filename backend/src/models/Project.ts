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
import { Sprint } from './Sprint';
import { User } from './User';

@Entity('projects')
export class Project {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column()
    name!: string;

    @Column({ unique: true })
    key!: string; // e.g., "PROJ"

    @Column({ type: 'text', nullable: true })
    description!: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'ownerId' })
    owner!: User;

    @Column()
    ownerId!: string;

    @OneToMany(() => Task, (task) => task.project)
    tasks!: Task[];

    @OneToMany(() => Sprint, (sprint) => sprint.project)
    sprints!: Sprint[];

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
