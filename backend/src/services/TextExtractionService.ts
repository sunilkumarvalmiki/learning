import pdf from 'pdf-parse';
import mammoth from 'mammoth';
import { minioClient } from '../scripts/init-minio';
import config from '../config';
import { FileType } from '../models/Document';

export interface ExtractionResult {
    content: string;
    metadata?: {
        pageCount?: number;
        wordCount?: number;
        language?: string;
    };
}

export class TextExtractionService {
    /**
     * Extract text from a file based on its type
     */
    async extractText(
        filePath: string,
        fileType: FileType,
        mimeType?: string
    ): Promise<ExtractionResult> {
        try {
            // Fetch file from MinIO
            const fileBuffer = await this.getFileFromMinIO(filePath);

            switch (fileType) {
                case FileType.PDF:
                    return this.extractFromPDF(fileBuffer);
                case FileType.TXT:
                case FileType.MD:
                    return this.extractFromText(fileBuffer);
                case FileType.DOCX:
                    return this.extractFromDOCX(fileBuffer);
                case FileType.IMAGE:
                    // OCR not implemented yet
                    return { content: '', metadata: { wordCount: 0 } };
                default:
                    return { content: '', metadata: { wordCount: 0 } };
            }
        } catch (error) {
            console.error('Text extraction error:', error);
            throw new Error(`Failed to extract text: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Fetch file buffer from MinIO
     */
    private async getFileFromMinIO(filePath: string): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            const chunks: Buffer[] = [];
            minioClient.getObject(config.minio.bucket, filePath, (err, stream) => {
                if (err) {
                    reject(err);
                    return;
                }
                stream.on('data', (chunk: Buffer) => chunks.push(chunk));
                stream.on('end', () => resolve(Buffer.concat(chunks)));
                stream.on('error', reject);
            });
        });
    }

    /**
     * Extract text from PDF files
     */
    private async extractFromPDF(buffer: Buffer): Promise<ExtractionResult> {
        const data = await pdf(buffer);
        const wordCount = data.text.split(/\s+/).filter(w => w.length > 0).length;

        return {
            content: data.text,
            metadata: {
                pageCount: data.numpages,
                wordCount,
            },
        };
    }

    /**
     * Extract text from plain text and markdown files
     */
    private async extractFromText(buffer: Buffer): Promise<ExtractionResult> {
        const content = buffer.toString('utf-8');
        const wordCount = content.split(/\s+/).filter(w => w.length > 0).length;
        const lineCount = content.split('\n').length;

        return {
            content,
            metadata: {
                pageCount: Math.ceil(lineCount / 50), // Approximate pages
                wordCount,
            },
        };
    }

    /**
     * Extract text from DOCX files using mammoth library
     */
    private async extractFromDOCX(buffer: Buffer): Promise<ExtractionResult> {
        const result = await mammoth.extractRawText({ buffer });
        const content = result.value;
        const wordCount = content.split(/\s+/).filter(w => w.length > 0).length;

        // Log any warnings from conversion
        if (result.messages.length > 0) {
            console.log('DOCX extraction warnings:', result.messages);
        }

        return {
            content,
            metadata: {
                wordCount,
            },
        };
    }

    /**
     * Generate a summary from extracted text (placeholder for AI summary)
     */
    generateSummary(content: string, maxLength: number = 500): string {
        if (!content || content.length === 0) {
            return '';
        }

        // Simple extractive summary - take first N characters
        // TODO: Replace with AI-powered summarization
        const cleaned = content.replace(/\s+/g, ' ').trim();
        if (cleaned.length <= maxLength) {
            return cleaned;
        }

        // Find last sentence boundary before maxLength
        const truncated = cleaned.substring(0, maxLength);
        const lastPeriod = truncated.lastIndexOf('.');
        const lastQuestion = truncated.lastIndexOf('?');
        const lastExclamation = truncated.lastIndexOf('!');
        const lastBoundary = Math.max(lastPeriod, lastQuestion, lastExclamation);

        if (lastBoundary > maxLength * 0.5) {
            return truncated.substring(0, lastBoundary + 1);
        }

        return truncated + '...';
    }
}

export const textExtractionService = new TextExtractionService();
