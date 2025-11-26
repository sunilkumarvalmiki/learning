import { Router } from 'express';
import { DocumentController } from '../controllers/DocumentController';
import { uploadSingle, handleUploadError } from '../middleware/upload';
import { validate, documentListQuerySchema } from '../middleware/validation';

const router = Router();
const documentController = new DocumentController();

/**
 * POST /api/v1/documents/upload
 * Upload a new document
 */
router.post(
    '/upload',
    uploadSingle,
    handleUploadError,
    documentController.upload.bind(documentController)
);

/**
 * GET /api/v1/documents
 * List documents with pagination and filters
 */
router.get(
    '/',
    validate(documentListQuerySchema),
    documentController.list.bind(documentController)
);

/**
 * GET /api/v1/documents/:id
 * Get a single document by ID
 */
router.get(
    '/:id',
    documentController.getById.bind(documentController)
);

/**
 * PATCH /api/v1/documents/:id
 * Update document metadata
 */
router.patch(
    '/:id',
    documentController.update.bind(documentController)
);

/**
 * DELETE /api/v1/documents/:id
 * Delete a document (soft delete)
 */
router.delete(
    '/:id',
    documentController.delete.bind(documentController)
);

export default router;
