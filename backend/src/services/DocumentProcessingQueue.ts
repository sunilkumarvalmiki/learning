import { AppDataSource } from '../config/database';
import { Document, DocumentStatus } from '../models/Document';
import { textExtractionService } from './TextExtractionService';
import { embeddingService } from './EmbeddingService';
import { logQueue, logError } from '../utils/structuredLogger';

interface ProcessingJob {
    documentId: string;
    userId: string;
    retryCount: number;
    addedAt: Date;
}

/**
 * Simple in-memory document processing queue
 * For production, consider using Bull/BullMQ with Redis
 */
export class DocumentProcessingQueue {
    private queue: ProcessingJob[] = [];
    private isProcessing = false;
    private concurrency = 2;
    private activeJobs = 0;
    private maxRetries = 3;

    private documentRepository = AppDataSource.getRepository(Document);

    /**
     * Add a document to the processing queue
     */
    addToQueue(documentId: string, userId: string): void {
        const job: ProcessingJob = {
            documentId,
            userId,
            retryCount: 0,
            addedAt: new Date(),
        };

        this.queue.push(job);
        logQueue('info', 'Document added to processing queue', {
            documentId,
            userId,
            queueSize: this.queue.length
        });

        // Start processing if not already running
        this.processQueue();
    }

    /**
     * Process jobs from the queue
     */
    private async processQueue(): Promise<void> {
        if (this.isProcessing && this.activeJobs >= this.concurrency) {
            return;
        }

        this.isProcessing = true;

        while (this.queue.length > 0 && this.activeJobs < this.concurrency) {
            const job = this.queue.shift();
            if (!job) continue;

            this.activeJobs++;
            this.processJob(job).finally(() => {
                this.activeJobs--;
                // Continue processing remaining jobs
                if (this.queue.length > 0) {
                    this.processQueue();
                }
            });
        }

        if (this.queue.length === 0 && this.activeJobs === 0) {
            this.isProcessing = false;
        }
    }

    /**
     * Process a single document
     */
    private async processJob(job: ProcessingJob): Promise<void> {
        const startTime = Date.now();
        logQueue('info', 'Processing document', {
            documentId: job.documentId,
            userId: job.userId,
            retryCount: job.retryCount
        });

        try {
            const document = await this.documentRepository.findOne({
                where: { id: job.documentId },
            });

            if (!document) {
                logError('Document not found in queue processing', undefined, {
                    documentId: job.documentId
                });
                return;
            }

            if (!document.filePath || !document.fileType) {
                await this.updateDocumentStatus(job.documentId, DocumentStatus.FAILED, 'Missing file path or type');
                return;
            }

            // Extract text content
            const extractionResult = await textExtractionService.extractText(
                document.filePath,
                document.fileType
            );

            // Generate summary
            const summary = textExtractionService.generateSummary(extractionResult.content, 500);

            // Update document with extracted content
            await this.documentRepository.update(job.documentId, {
                content: extractionResult.content,
                summary,
                status: DocumentStatus.COMPLETED,
            });

            let embeddingResult: { chunksProcessed: number; totalTokens: number } | null = null;
            // Generate and store embeddings in Qdrant
            try {
                embeddingResult = await embeddingService.processDocument(
                    job.documentId,
                    job.userId,
                    extractionResult.content,
                    document.fileType,
                    document.title
                );
                logQueue('info', 'Embeddings generated', {
                    documentId: job.documentId,
                    chunksProcessed: embeddingResult.chunksProcessed,
                    totalTokens: embeddingResult.totalTokens
                });
            } catch (embeddingError) {
                logQueue('warn', 'Embedding generation failed for document', {
                    documentId: job.documentId,
                    error: embeddingError instanceof Error ? embeddingError.message : String(embeddingError)
                });
                // Don't fail the entire job if embeddings fail
            }

            const duration = Date.now() - startTime;
            logQueue('info', 'Document processed successfully', {
                documentId: job.documentId,
                duration,
                contentLength: extractionResult.content.length,
                wordCount: extractionResult.metadata?.wordCount || 0,
                embeddings: embeddingResult ? {
                    chunks: embeddingResult.chunksProcessed,
                    tokens: embeddingResult.totalTokens
                } : null
            });

        } catch (error: any) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            logError('Failed to process document', error, {
                documentId: job.documentId,
                retryCount: job.retryCount
            });

            // Retry logic
            if (job.retryCount < this.maxRetries) {
                job.retryCount++;
                logQueue('warn', 'Retrying document processing', {
                    documentId: job.documentId,
                    retryCount: job.retryCount,
                    maxRetries: this.maxRetries
                });
                this.queue.push(job);
            } else {
                await this.updateDocumentStatus(job.documentId, DocumentStatus.FAILED, errorMessage);
            }
        }
    }

    /**
     * Update document status
     */
    private async updateDocumentStatus(
        documentId: string,
        status: DocumentStatus,
        error?: string
    ): Promise<void> {
        const updateData: Partial<Document> = { status };
        if (error) {
            updateData.processingError = error;
        }
        await this.documentRepository.update(documentId, updateData);
    }

    /**
     * Get queue status
     */
    getStatus(): { queueSize: number; activeJobs: number; isProcessing: boolean } {
        return {
            queueSize: this.queue.length,
            activeJobs: this.activeJobs,
            isProcessing: this.isProcessing,
        };
    }
}

// Singleton instance
export const documentProcessingQueue = new DocumentProcessingQueue();
