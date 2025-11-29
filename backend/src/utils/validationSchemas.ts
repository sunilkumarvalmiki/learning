import { z } from 'zod';

/**
 * Common validation schemas
 */

export const registerSchema = z.object({
    body: z.object({
        email: z.string().email('Invalid email address'),
        password: z
            .string()
            .min(8, 'Password must be at least 8 characters')
            .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
            .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
            .regex(/[0-9]/, 'Password must contain at least one number'),
        firstName: z.string().min(2, 'First name is too short').optional(),
        lastName: z.string().min(2, 'Last name is too short').optional(),
    }),
});

export const loginSchema = z.object({
    body: z.object({
        email: z.string().email('Invalid email address'),
        password: z.string().min(1, 'Password is required'),
    }),
});

export const documentUploadSchema = z.object({
    body: z.object({
        title: z.string().min(1, 'Title is required').optional(),
        description: z.string().optional(),
    }),
});

export const searchSchema = z.object({
    query: z.object({
        q: z.string().min(1, 'Search query is required'),
        limit: z.string().regex(/^\d+$/).transform(Number).optional(),
        offset: z.string().regex(/^\d+$/).transform(Number).optional(),
        type: z.enum(['fulltext', 'semantic', 'hybrid']).optional(),
    }),
});
