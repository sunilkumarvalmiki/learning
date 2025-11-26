import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from 'typeorm';

export enum DocumentStatus {
    UPLOADING = 'uploading',
    PROCESSING = 'processing',
    COMPLETED = 'completed',
    FAILED = 'failed'
}

export enum FileType {
    PDF = 'pdf',
    DOCX = 'docx',
    TXT = 'txt',
    MD = 'md',
    IMAGE = 'image',
    VIDEO = 'video',
    AUDIO = 'audio',
    OTHER = 'other'
}

@Entity('documents')
export class Document {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ name: 'user_id', type: 'uuid' })
    userId!: string;

    @Column({ name: 'workspace_id', type: 'uuid', nullable: true })
    workspaceId?: string;

    // Content
    @Column({ length: 500 })
    title!: string;

    @Column({ type: 'text', nullable: true })
    content?: string;

    @Column({ type: 'text', nullable: true })
    summary?: string;

    // File metadata
    @Column({ name: 'file_path', length: 1000, nullable: true })
    filePath?: string;

    @Column({ name: 'file_name', length: 255, nullable: true })
    fileName?: string;

    @Column({ name: 'file_size_bytes', type: 'bigint', nullable: true })
    fileSizeBytes?: number;

    @Column({ name: 'file_type', type: 'enum', enum: FileType, nullable: true })
    fileType?: FileType;

    @Column({ name: 'mime_type', length: 100, nullable: true })
    mimeType?: string;

    // Processing status
    @Column({
        type: 'enum',
        enum: DocumentStatus,
        default: DocumentStatus.UPLOADING
    })
    status!: DocumentStatus;

    @Column({ name: 'processing_error', type: 'text', nullable: true })
    processingError?: string;

    // Timestamps
    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt!: Date;

    @DeleteDateColumn({ name: 'deleted_at', nullable: true })
    deletedAt?: Date;
}
