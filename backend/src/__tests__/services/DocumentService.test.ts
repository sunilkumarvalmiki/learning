import { DocumentService } from '../../services/DocumentService';
import { Document, DocumentStatus, FileType } from '../../models/Document';
import { AppDataSource } from '../../config/database';
import { minioClient } from '../../scripts/init-minio';
import { documentProcessingQueue } from '../../services/DocumentProcessingQueue';
import { embeddingService } from '../../services/EmbeddingService';

// Mock dependencies
jest.mock('../../config/database', () => ({
    AppDataSource: {
        getRepository: jest.fn(),
    },
}));

jest.mock('../../scripts/init-minio', () => ({
    minioClient: {
        putObject: jest.fn(),
        removeObject: jest.fn(),
    },
}));

jest.mock('../../services/DocumentProcessingQueue', () => ({
    documentProcessingQueue: {
        addToQueue: jest.fn(),
    },
}));

jest.mock('../../services/EmbeddingService', () => ({
    embeddingService: {
        deleteDocumentEmbeddings: jest.fn(),
    },
}));

describe('DocumentService', () => {
    let documentService: DocumentService;
    let mockDocumentRepository: any;
    let mockQueryBuilder: any;

    beforeEach(() => {
        jest.clearAllMocks();

        mockQueryBuilder = {
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            getCount: jest.fn(),
            orderBy: jest.fn().mockReturnThis(),
            skip: jest.fn().mockReturnThis(),
            take: jest.fn().mockReturnThis(),
            getMany: jest.fn(),
        };

        mockDocumentRepository = {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            softDelete: jest.fn(),
            createQueryBuilder: jest.fn(() => mockQueryBuilder),
        };

        (AppDataSource.getRepository as jest.Mock).mockReturnValue(mockDocumentRepository);

        documentService = new DocumentService();
    });

    describe('uploadDocument', () => {
        const mockFile = {
            originalname: 'test.pdf',
            buffer: Buffer.from('test'),
            size: 1024,
            mimetype: 'application/pdf',
        } as Express.Multer.File;

        const userId = 'user-123';

        it('should successfully upload a document', async () => {
            const mockDocument = {
                id: expect.any(String),
                userId,
                title: mockFile.originalname,
                fileName: mockFile.originalname,
                status: DocumentStatus.PROCESSING,
            };

            mockDocumentRepository.create.mockReturnValue(mockDocument);
            mockDocumentRepository.save.mockResolvedValue(mockDocument);
            (minioClient.putObject as jest.Mock).mockResolvedValue(undefined);

            const result = await documentService.uploadDocument(mockFile, userId);

            expect(result).toEqual(mockDocument);
            expect(minioClient.putObject).toHaveBeenCalledWith(
                expect.any(String),
                expect.stringContaining('user-123/'),
                mockFile.buffer,
                mockFile.size,
                expect.objectContaining({
                    'Content-Type': mockFile.mimetype,
                    'Original-Filename': mockFile.originalname,
                })
            );
            expect(documentProcessingQueue.addToQueue).toHaveBeenCalledWith(
                expect.any(String),
                userId
            );
        });

        it('should correctly identify PDF file type', async () => {
            const mockDocument = { id: 'doc-123' };
            mockDocumentRepository.create.mockReturnValue(mockDocument);
            mockDocumentRepository.save.mockResolvedValue(mockDocument);
            (minioClient.putObject as jest.Mock).mockResolvedValue(undefined);

            await documentService.uploadDocument(mockFile, userId);

            expect(mockDocumentRepository.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    fileType: FileType.PDF,
                })
            );
        });

        it('should correctly identify DOCX file type', async () => {
            const docxFile = {
                ...mockFile,
                originalname: 'test.docx',
                mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            } as Express.Multer.File;

            const mockDocument = { id: 'doc-123' };
            mockDocumentRepository.create.mockReturnValue(mockDocument);
            mockDocumentRepository.save.mockResolvedValue(mockDocument);
            (minioClient.putObject as jest.Mock).mockResolvedValue(undefined);

            await documentService.uploadDocument(docxFile, userId);

            expect(mockDocumentRepository.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    fileType: FileType.DOCX,
                })
            );
        });

        it('should correctly identify TXT file type', async () => {
            const txtFile = {
                ...mockFile,
                originalname: 'test.txt',
                mimetype: 'text/plain',
            } as Express.Multer.File;

            const mockDocument = { id: 'doc-123' };
            mockDocumentRepository.create.mockReturnValue(mockDocument);
            mockDocumentRepository.save.mockResolvedValue(mockDocument);
            (minioClient.putObject as jest.Mock).mockResolvedValue(undefined);

            await documentService.uploadDocument(txtFile, userId);

            expect(mockDocumentRepository.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    fileType: FileType.TXT,
                })
            );
        });

        it('should correctly identify IMAGE file types', async () => {
            const imageExtensions = ['png', 'jpg', 'jpeg', 'gif'];

            for (const ext of imageExtensions) {
                const imageFile = {
                    ...mockFile,
                    originalname: `test.${ext}`,
                    mimetype: `image/${ext}`,
                } as Express.Multer.File;

                const mockDocument = { id: 'doc-123' };
                mockDocumentRepository.create.mockReturnValue(mockDocument);
                mockDocumentRepository.save.mockResolvedValue(mockDocument);
                (minioClient.putObject as jest.Mock).mockResolvedValue(undefined);

                await documentService.uploadDocument(imageFile, userId);

                expect(mockDocumentRepository.create).toHaveBeenCalledWith(
                    expect.objectContaining({
                        fileType: FileType.IMAGE,
                    })
                );
            }
        });

        it('should use custom title if provided', async () => {
            const customTitle = 'Custom Title';
            const mockDocument = { id: 'doc-123' };
            mockDocumentRepository.create.mockReturnValue(mockDocument);
            mockDocumentRepository.save.mockResolvedValue(mockDocument);
            (minioClient.putObject as jest.Mock).mockResolvedValue(undefined);

            await documentService.uploadDocument(mockFile, userId, { title: customTitle });

            expect(mockDocumentRepository.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: customTitle,
                })
            );
        });

        it('should include workspaceId if provided', async () => {
            const workspaceId = 'workspace-123';
            const mockDocument = { id: 'doc-123' };
            mockDocumentRepository.create.mockReturnValue(mockDocument);
            mockDocumentRepository.save.mockResolvedValue(mockDocument);
            (minioClient.putObject as jest.Mock).mockResolvedValue(undefined);

            await documentService.uploadDocument(mockFile, userId, { workspaceId });

            expect(mockDocumentRepository.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    workspaceId,
                })
            );
        });

        it('should throw error if MinIO upload fails', async () => {
            (minioClient.putObject as jest.Mock).mockRejectedValue(new Error('MinIO error'));

            await expect(
                documentService.uploadDocument(mockFile, userId)
            ).rejects.toThrow('Failed to upload document: MinIO error');

            expect(mockDocumentRepository.save).not.toHaveBeenCalled();
        });

        it('should set document status to PROCESSING', async () => {
            const mockDocument = { id: 'doc-123' };
            mockDocumentRepository.create.mockReturnValue(mockDocument);
            mockDocumentRepository.save.mockResolvedValue(mockDocument);
            (minioClient.putObject as jest.Mock).mockResolvedValue(undefined);

            await documentService.uploadDocument(mockFile, userId);

            expect(mockDocumentRepository.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    status: DocumentStatus.PROCESSING,
                })
            );
        });
    });

    describe('listDocuments', () => {
        const userId = 'user-123';

        it('should list documents with default pagination', async () => {
            const mockDocuments = [
                { id: 'doc-1', title: 'Document 1' },
                { id: 'doc-2', title: 'Document 2' },
            ];

            mockQueryBuilder.getCount.mockResolvedValue(10);
            mockQueryBuilder.getMany.mockResolvedValue(mockDocuments);

            const result = await documentService.listDocuments(userId);

            expect(result).toEqual({
                documents: mockDocuments,
                total: 10,
                page: 1,
                totalPages: 1,
            });

            expect(mockQueryBuilder.where).toHaveBeenCalledWith(
                'document.userId = :userId',
                { userId }
            );
        });

        it('should apply pagination correctly', async () => {
            mockQueryBuilder.getCount.mockResolvedValue(50);
            mockQueryBuilder.getMany.mockResolvedValue([]);

            await documentService.listDocuments(userId, { page: 2, limit: 10 });

            expect(mockQueryBuilder.skip).toHaveBeenCalledWith(10);
            expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
        });

        it('should filter by status', async () => {
            mockQueryBuilder.getCount.mockResolvedValue(0);
            mockQueryBuilder.getMany.mockResolvedValue([]);

            await documentService.listDocuments(userId, {
                status: DocumentStatus.COMPLETED,
            });

            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
                'document.status = :status',
                { status: DocumentStatus.COMPLETED }
            );
        });

        it('should filter by file type', async () => {
            mockQueryBuilder.getCount.mockResolvedValue(0);
            mockQueryBuilder.getMany.mockResolvedValue([]);

            await documentService.listDocuments(userId, {
                fileType: FileType.PDF,
            });

            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
                'document.fileType = :fileType',
                { fileType: FileType.PDF }
            );
        });

        it('should filter by search term', async () => {
            mockQueryBuilder.getCount.mockResolvedValue(0);
            mockQueryBuilder.getMany.mockResolvedValue([]);

            await documentService.listDocuments(userId, {
                search: 'test',
            });

            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
                'document.title ILIKE :search',
                { search: '%test%' }
            );
        });

        it('should calculate total pages correctly', async () => {
            mockQueryBuilder.getCount.mockResolvedValue(25);
            mockQueryBuilder.getMany.mockResolvedValue([]);

            const result = await documentService.listDocuments(userId, { limit: 10 });

            expect(result.totalPages).toBe(3);
        });

        it('should order by createdAt DESC', async () => {
            mockQueryBuilder.getCount.mockResolvedValue(0);
            mockQueryBuilder.getMany.mockResolvedValue([]);

            await documentService.listDocuments(userId);

            expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
                'document.createdAt',
                'DESC'
            );
        });
    });

    describe('getDocumentById', () => {
        it('should return document when found', async () => {
            const mockDocument = {
                id: 'doc-123',
                userId: 'user-123',
                title: 'Test Document',
            };

            mockDocumentRepository.findOne.mockResolvedValue(mockDocument);

            const result = await documentService.getDocumentById('doc-123', 'user-123');

            expect(result).toEqual(mockDocument);
            expect(mockDocumentRepository.findOne).toHaveBeenCalledWith({
                where: {
                    id: 'doc-123',
                    userId: 'user-123',
                    deletedAt: null,
                },
            });
        });

        it('should return null when document not found', async () => {
            mockDocumentRepository.findOne.mockResolvedValue(null);

            const result = await documentService.getDocumentById('doc-123', 'user-123');

            expect(result).toBeNull();
        });

        it('should not return documents from other users', async () => {
            mockDocumentRepository.findOne.mockResolvedValue(null);

            await documentService.getDocumentById('doc-123', 'wrong-user');

            expect(mockDocumentRepository.findOne).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        userId: 'wrong-user',
                    }),
                })
            );
        });
    });

    describe('deleteDocument', () => {
        it('should successfully delete a document', async () => {
            const mockDocument = {
                id: 'doc-123',
                userId: 'user-123',
            };

            mockDocumentRepository.findOne.mockResolvedValue(mockDocument);
            mockDocumentRepository.softDelete.mockResolvedValue(undefined);
            (embeddingService.deleteDocumentEmbeddings as jest.Mock).mockResolvedValue(undefined);

            const result = await documentService.deleteDocument('doc-123', 'user-123');

            expect(result).toBe(true);
            expect(mockDocumentRepository.softDelete).toHaveBeenCalledWith('doc-123');
            expect(embeddingService.deleteDocumentEmbeddings).toHaveBeenCalledWith('doc-123');
        });

        it('should return false if document not found', async () => {
            mockDocumentRepository.findOne.mockResolvedValue(null);

            const result = await documentService.deleteDocument('doc-123', 'user-123');

            expect(result).toBe(false);
            expect(mockDocumentRepository.softDelete).not.toHaveBeenCalled();
        });

        it('should not fail if embedding deletion fails', async () => {
            const mockDocument = {
                id: 'doc-123',
                userId: 'user-123',
            };

            mockDocumentRepository.findOne.mockResolvedValue(mockDocument);
            mockDocumentRepository.softDelete.mockResolvedValue(undefined);
            (embeddingService.deleteDocumentEmbeddings as jest.Mock).mockRejectedValue(
                new Error('Qdrant error')
            );

            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

            const result = await documentService.deleteDocument('doc-123', 'user-123');

            expect(result).toBe(true);
            expect(consoleErrorSpy).toHaveBeenCalled();

            consoleErrorSpy.mockRestore();
        });
    });

    describe('updateDocument', () => {
        it('should update document title', async () => {
            const mockDocument = {
                id: 'doc-123',
                userId: 'user-123',
                title: 'Old Title',
                summary: '',
            };

            mockDocumentRepository.findOne.mockResolvedValue(mockDocument);
            mockDocumentRepository.save.mockResolvedValue({
                ...mockDocument,
                title: 'New Title',
            });

            const result = await documentService.updateDocument('doc-123', 'user-123', {
                title: 'New Title',
            });

            expect(result?.title).toBe('New Title');
            expect(mockDocumentRepository.save).toHaveBeenCalledWith(mockDocument);
        });

        it('should update document summary', async () => {
            const mockDocument = {
                id: 'doc-123',
                userId: 'user-123',
                title: 'Title',
                summary: '',
            };

            mockDocumentRepository.findOne.mockResolvedValue(mockDocument);
            mockDocumentRepository.save.mockResolvedValue({
                ...mockDocument,
                summary: 'New Summary',
            });

            const result = await documentService.updateDocument('doc-123', 'user-123', {
                summary: 'New Summary',
            });

            expect(result?.summary).toBe('New Summary');
        });

        it('should return null if document not found', async () => {
            mockDocumentRepository.findOne.mockResolvedValue(null);

            const result = await documentService.updateDocument('doc-123', 'user-123', {
                title: 'New Title',
            });

            expect(result).toBeNull();
            expect(mockDocumentRepository.save).not.toHaveBeenCalled();
        });

        it('should update both title and summary', async () => {
            const mockDocument = {
                id: 'doc-123',
                userId: 'user-123',
                title: 'Old Title',
                summary: 'Old Summary',
            };

            mockDocumentRepository.findOne.mockResolvedValue(mockDocument);
            mockDocumentRepository.save.mockResolvedValue(mockDocument);

            await documentService.updateDocument('doc-123', 'user-123', {
                title: 'New Title',
                summary: 'New Summary',
            });

            expect(mockDocument.title).toBe('New Title');
            expect(mockDocument.summary).toBe('New Summary');
        });
    });
});
