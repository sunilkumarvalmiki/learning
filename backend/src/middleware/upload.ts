import multer from 'multer';
import path from 'path';
import { Request } from 'express';
import config from '../config';

// Configure multer for memory storage (we'll upload to MinIO)
const storage = multer.memoryStorage();

// File filter function
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    // Get file extension
    const ext = path.extname(file.originalname).toLowerCase().substring(1);

    // Check if file type is allowed
    if (config.upload.allowedFileTypes.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error(`File type .${ext} is not allowed. Allowed types: ${config.upload.allowedFileTypes.join(', ')}`));
    }
};

// Create multer upload instance
export const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: config.upload.maxFileSizeMB * 1024 * 1024, // Convert MB to bytes
    },
});

// Middleware for single file upload
export const uploadSingle = upload.single('file');

// Error handling middleware for multer
export const handleUploadError = (err: any, req: Request, res: any, next: any) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                error: 'File too large',
                message: `Maximum file size is ${config.upload.maxFileSizeMB}MB`,
            });
        }
        return res.status(400).json({
            error: 'Upload error',
            message: err.message,
        });
    } else if (err) {
        return res.status(400).json({
            error: 'Invalid file',
            message: err.message,
        });
    }
    next();
};
