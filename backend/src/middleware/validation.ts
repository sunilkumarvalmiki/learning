import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';

// Legacy export for backwards compatibility
export const documentListQuerySchema = z.object({
    page: z.string().optional().default('1').transform(Number),
    limit: z.string().optional().default('20').transform(Number),
    status: z.enum(['uploading', 'processing', 'completed', 'failed']).optional(),
    fileType: z.enum(['pdf', 'docx', 'txt', 'md', 'image', 'video', 'audio', 'other']).optional(),
    search: z.string().optional(),
});

// Enhanced validation middleware with support for body, query, and params
export const validate = (schema: z.ZodSchema) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            // Parse the schema to determine what to validate
            const shape = (schema as any)._def?.shape?.();

            let dataToValidate: any = {};

            if (shape) {
                // Schema has structure (body, query, params)
                if (shape.body) {
                    dataToValidate.body = req.body;
                }
                if (shape.query) {
                    dataToValidate.query = req.query;
                }
                if (shape.params) {
                    dataToValidate.params = req.params;
                }
            } else {
                // Legacy: combine all request data
                dataToValidate = {
                    ...req.query,
                    ...req.body,
                    ...req.params,
                };
            }

            const validated = await schema.parseAsync(dataToValidate);

            // Attach validated data to request
            if (validated.body !== undefined) {
                req.body = validated.body;
            }
            if (validated.query !== undefined) {
                (req as any).query = validated.query;
            }
            if (validated.params !== undefined) {
                (req as any).params = validated.params;
            }

            // Store all validated data
            (req as any).validated = validated;

            next();
        } catch (error) {
            if (error instanceof z.ZodError) {
                return res.status(400).json({
                    error: 'Validation error',
                    message: 'Invalid request data',
                    details: error.errors.map(err => ({
                        field: err.path.join('.'),
                        message: err.message,
                        code: err.code,
                    })),
                });
            }
            next(error);
        }
    };
};
