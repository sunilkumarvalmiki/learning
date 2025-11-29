import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { User } from './User';
import { Task } from './Task';

@Entity('comments')
export class Comment {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column('text')
    content!: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'authorId' })
    author!: User;

    @Column()
    authorId!: string;

    @ManyToOne(() => Task, (task) => task.comments, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'taskId' })
    task!: Task;

    @Column()
    taskId!: string;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
