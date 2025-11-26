import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';

// Zod schema for query parameters validation
export const documentListQuerySchema = z.object({
    page: z.string().optional().default('1').transform(Number),
    limit: z.string().optional().default('20').transform(Number),
    status: z.enum(['uploading', 'processing', 'completed', 'failed']).optional(),
    fileType: z.enum(['pdf', 'docx', 'txt', 'md', 'image', 'video', 'audio', 'other']).optional(),
    search: z.string().optional(),
});

// Middleware to validate request data
export const validate = (schema: z.ZodSchema) => {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            // Validate query params, body, or params depending on request
            const data = {
                ...req.query,
                ...req.body,
                ...req.params,
            };

            const validated = schema.parse(data);

            // Attach validated data to request
            (req as any).validated = validated;

            next();
        } catch (error) {
            if (error instanceof z.ZodError) {
                return res.status(400).json({
                    error: 'Validation error',
                    details: error.errors.map(err => ({
                        field: err.path.join('.'),
                        message: err.message,
                    })),
                });
            }
            next(error);
        }
    };
};
