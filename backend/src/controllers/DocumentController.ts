import { Response, NextFunction } from 'express';
import { DocumentService } from '../services/DocumentService';
import { AuthenticatedRequest } from '../middleware/auth';

const documentService = new DocumentService();

export class DocumentController {
    /**
     * Upload a new document
     * POST /api/v1/documents/upload
     */
    async upload(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            if (!req.file) {
                return res.status(400).json({
                    error: 'No file uploaded',
                    message: 'Please provide a file in the request',
                });
            }

            // Get userId from auth middleware (optionalAuth sets this)
            const userId = req.userId || req.body.userId;

            if (!userId) {
                return res.status(401).json({
                    error: 'Unauthorized',
                    message: 'User ID is required',
                });
            }

            const document = await documentService.uploadDocument(req.file, userId, {
                title: req.body.title,
                workspaceId: req.body.workspaceId,
            });

            res.status(201).json({
                message: 'Document uploaded successfully',
                document: {
                    id: document.id,
                    title: document.title,
                    fileName: document.fileName,
                    fileSize: document.fileSizeBytes,
                    fileType: document.fileType,
                    status: document.status,
                    createdAt: document.createdAt,
                },
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * List documents
     * GET /api/v1/documents
     */
    async list(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            // Get validated query params from validation middleware
            const { page, limit, status, fileType, search } = (req as any).validated || {};

            // Get userId from auth middleware
            const userId = req.userId || (req.query.userId as string);

            if (!userId) {
                return res.status(401).json({
                    error: 'Unauthorized',
                    message: 'User ID is required',
                });
            }

            const result = await documentService.listDocuments(userId, {
                page,
                limit,
                status,
                fileType,
                search,
            });

            res.json({
                documents: result.documents.map(doc => ({
                    id: doc.id,
                    title: doc.title,
                    fileName: doc.fileName,
                    fileSize: doc.fileSizeBytes,
                    fileType: doc.fileType,
                    status: doc.status,
                    createdAt: doc.createdAt,
                    updatedAt: doc.updatedAt,
                })),
                pagination: {
                    page: result.page,
                    limit,
                    total: result.total,
                    totalPages: result.totalPages,
                },
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get a single document
     * GET /api/v1/documents/:id
     */
    async getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;

            // Get userId from auth middleware
            const userId = req.userId || (req.query.userId as string);

            if (!userId) {
                return res.status(401).json({
                    error: 'Unauthorized',
                    message: 'User ID is required',
                });
            }

            const document = await documentService.getDocumentById(id, userId);

            if (!document) {
                return res.status(404).json({
                    error: 'Document not found',
                    message: `Document with ID ${id} not found`,
                });
            }

            res.json({
                document: {
                    id: document.id,
                    title: document.title,
                    content: document.content,
                    summary: document.summary,
                    fileName: document.fileName,
                    filePath: document.filePath,
                    fileSize: document.fileSizeBytes,
                    fileType: document.fileType,
                    mimeType: document.mimeType,
                    status: document.status,
                    createdAt: document.createdAt,
                    updatedAt: document.updatedAt,
                },
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Delete a document
     * DELETE /api/v1/documents/:id
     */
    async delete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;

            // Get userId from auth middleware
            const userId = req.userId || (req.query.userId as string);

            if (!userId) {
                return res.status(401).json({
                    error: 'Unauthorized',
                    message: 'User ID is required',
                });
            }

            const deleted = await documentService.deleteDocument(id, userId);

            if (!deleted) {
                return res.status(404).json({
                    error: 'Document not found',
                    message: `Document with ID ${id} not found`,
                });
            }

            res.json({
                message: 'Document deleted successfully',
                documentId: id,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Update document metadata
     * PATCH /api/v1/documents/:id
     */
    async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const { title, summary } = req.body;

            // Get userId from auth middleware
            const userId = req.userId || req.body.userId;

            if (!userId) {
                return res.status(401).json({
                    error: 'Unauthorized',
                    message: 'User ID is required',
                });
            }

            const document = await documentService.updateDocument(id, userId, {
                title,
                summary,
            });

            if (!document) {
                return res.status(404).json({
                    error: 'Document not found',
                    message: `Document with ID ${id} not found`,
                });
            }

            res.json({
                message: 'Document updated successfully',
                document: {
                    id: document.id,
                    title: document.title,
                    summary: document.summary,
                    updatedAt: document.updatedAt,
                },
            });
        } catch (error) {
            next(error);
        }
    }
}
