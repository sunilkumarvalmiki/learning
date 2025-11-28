import { AppDataSource } from '../config/database';
import { Document, DocumentStatus, FileType } from '../models/Document';
import { minioClient } from '../scripts/init-minio';
import { documentProcessingQueue } from './DocumentProcessingQueue';
import { embeddingService } from './EmbeddingService';
import { getCacheService } from './CacheService';
import config from '../config';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

export class DocumentService {
    private documentRepository = AppDataSource.getRepository(Document);
    private cache = getCacheService();

    /**
     * Upload a document file to MinIO and create database record
     */
    async uploadDocument(
        file: Express.Multer.File,
        userId: string,
        metadata?: { title?: string; workspaceId?: string }
    ): Promise<Document> {
        const documentId = uuidv4();
        const fileExtension = path.extname(file.originalname);
        const fileName = `${documentId}${fileExtension}`;
        const filePath = `user-${userId}/${fileName}`;

        try {
            // Upload to MinIO
            await minioClient.putObject(
                config.minio.bucket,
                filePath,
                file.buffer,
                file.size,
                {
                    'Content-Type': file.mimetype,
                    'Original-Filename': file.originalname,
                }
            );

            // Determine file type
            const ext = fileExtension.toLowerCase().substring(1);
            let fileType: FileType = FileType.OTHER;
            if (ext === 'pdf') fileType = FileType.PDF;
            else if (ext === 'docx') fileType = FileType.DOCX;
            else if (ext === 'txt') fileType = FileType.TXT;
            else if (ext === 'md') fileType = FileType.MD;
            else if (['png', 'jpg', 'jpeg', 'gif'].includes(ext)) fileType = FileType.IMAGE;

            // Create document record
            const document = this.documentRepository.create({
                id: documentId,
                userId,
                workspaceId: metadata?.workspaceId,
                title: metadata?.title || file.originalname,
                fileName: file.originalname,
                filePath,
                fileSizeBytes: file.size,
                fileType,
                mimeType: file.mimetype,
                status: DocumentStatus.PROCESSING,
            });

            await this.documentRepository.save(document);

            // Queue document for text extraction and processing
            documentProcessingQueue.addToQueue(documentId, userId);

            return document;
        } catch (error) {
            // If MinIO upload fails, don't create DB record
            throw new Error(`Failed to upload document: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * List documents for a user
     */
    async listDocuments(
        userId: string,
        options?: {
            page?: number;
            limit?: number;
            status?: DocumentStatus;
            fileType?: FileType;
            search?: string;
        }
    ): Promise<{ documents: Document[]; total: number; page: number; totalPages: number }> {
        const page = options?.page || 1;
        const limit = options?.limit || 20;
        const skip = (page - 1) * limit;

        const query = this.documentRepository
            .createQueryBuilder('document')
            .where('document.userId = :userId', { userId })
            .andWhere('document.deletedAt IS NULL');

        // Apply filters
        if (options?.status) {
            query.andWhere('document.status = :status', { status: options.status });
        }
        if (options?.fileType) {
            query.andWhere('document.fileType = :fileType', { fileType: options.fileType });
        }
        if (options?.search) {
            query.andWhere('document.title ILIKE :search', { search: `%${options.search}%` });
        }

        // Get total count
        const total = await query.getCount();

        // Get paginated results
        const documents = await query
            .orderBy('document.createdAt', 'DESC')
            .skip(skip)
            .take(limit)
            .getMany();

        return {
            documents,
            total,
            page,
            totalPages: Math.ceil(total / limit),
        };
    }

    /**
     * Get a single document by ID
     */
    async getDocumentById(documentId: string, userId: string): Promise<Document | null> {
        // Create cache key
        const cacheKey = `document:${documentId}:${userId}`;

        // Try to get from cache
        const cached = await this.cache.get<Document>(cacheKey);
        if (cached) {
            return cached;
        }

        // Fetch from database
        const document = await this.documentRepository.findOne({
            where: {
                id: documentId,
                userId,
                deletedAt: null as any, // TypeORM typing issue with null
            },
        });

        // Cache for 30 minutes (1800 seconds)
        if (document) {
            await this.cache.set(cacheKey, document, { ttl: 1800 });
        }

        return document;
    }

    /**
     * Delete a document (soft delete)
     */
    async deleteDocument(documentId: string, userId: string): Promise<boolean> {
        const document = await this.getDocumentById(documentId, userId);

        if (!document) {
            return false;
        }

        // Soft delete in database
        await this.documentRepository.softDelete(documentId);

        // Invalidate cache
        await this.cache.delete(`document:${documentId}:${userId}`);

        // Delete embeddings from Qdrant
        try {
            await embeddingService.deleteDocumentEmbeddings(documentId);
        } catch (error) {
            console.error(`Failed to delete embeddings for document ${documentId}:`, error);
            // Don't fail the delete operation if embedding cleanup fails
        }

        // Optionally delete from MinIO (keeping for now in case of undelete)
        // await minioClient.removeObject(config.minio.bucket, document.filePath!);

        return true;
    }

    /**
     * Update document metadata
     */
    async updateDocument(
        documentId: string,
        userId: string,
        updates: { title?: string; summary?: string }
    ): Promise<Document | null> {
        const document = await this.getDocumentById(documentId, userId);

        if (!document) {
            return null;
        }

        if (updates.title) document.title = updates.title;
        if (updates.summary) document.summary = updates.summary;

        await this.documentRepository.save(document);

        // Invalidate cache
        await this.cache.delete(`document:${documentId}:${userId}`);

        return document;
    }
}
