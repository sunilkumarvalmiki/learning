import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { User } from './User';
import { Task } from './Task';

@Entity('attachments')
export class Attachment {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column()
    fileName!: string;

    @Column()
    filePath!: string;

    @Column()
    fileType!: string;

    @Column('int')
    fileSize!: number;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'uploaderId' })
    uploader!: User;

    @Column()
    uploaderId!: string;

    @ManyToOne(() => Task, (task) => task.attachments, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'taskId' })
    task!: Task;

    @Column()
    taskId!: string;

    @CreateDateColumn()
    createdAt!: Date;
}
