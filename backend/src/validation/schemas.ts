import { z } from 'zod';

// ============================================================================
// AUTHENTICATION SCHEMAS
// ============================================================================

export const registerSchema = z.object({
    body: z.object({
        email: z.string()
            .email('Invalid email format')
            .min(5, 'Email must be at least 5 characters')
            .max(255, 'Email must not exceed 255 characters'),
        password: z.string()
            .min(8, 'Password must be at least 8 characters')
            .max(100, 'Password must not exceed 100 characters')
            .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
            .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
            .regex(/[0-9]/, 'Password must contain at least one number'),
        fullName: z.string()
            .min(2, 'Full name must be at least 2 characters')
            .max(100, 'Full name must not exceed 100 characters')
            .optional(),
    }),
});

export const loginSchema = z.object({
    body: z.object({
        email: z.string()
            .email('Invalid email format')
            .min(5, 'Email must be at least 5 characters')
            .max(255, 'Email must not exceed 255 characters'),
        password: z.string()
            .min(1, 'Password is required')
            .max(100, 'Password must not exceed 100 characters'),
    }),
});

export const updateProfileSchema = z.object({
    body: z.object({
        fullName: z.string()
            .min(2, 'Full name must be at least 2 characters')
            .max(100, 'Full name must not exceed 100 characters')
            .optional(),
    }),
});

export const changePasswordSchema = z.object({
    body: z.object({
        currentPassword: z.string()
            .min(1, 'Current password is required')
            .max(100, 'Current password must not exceed 100 characters'),
        newPassword: z.string()
            .min(8, 'New password must be at least 8 characters')
            .max(100, 'New password must not exceed 100 characters')
            .regex(/[A-Z]/, 'New password must contain at least one uppercase letter')
            .regex(/[a-z]/, 'New password must contain at least one lowercase letter')
            .regex(/[0-9]/, 'New password must contain at least one number'),
    }),
});

// ============================================================================
// DOCUMENT SCHEMAS
// ============================================================================

export const documentListQuerySchema = z.object({
    query: z.object({
        page: z.string()
            .optional()
            .default('1')
            .transform(val => parseInt(val, 10))
            .refine(val => val > 0, 'Page must be greater than 0'),
        limit: z.string()
            .optional()
            .default('20')
            .transform(val => parseInt(val, 10))
            .refine(val => val > 0 && val <= 100, 'Limit must be between 1 and 100'),
        status: z.enum(['uploading', 'processing', 'completed', 'failed']).optional(),
        fileType: z.enum(['pdf', 'docx', 'txt', 'md', 'image', 'video', 'audio', 'other']).optional(),
        search: z.string()
            .max(500, 'Search query must not exceed 500 characters')
            .optional(),
    }),
});

export const documentIdParamSchema = z.object({
    params: z.object({
        id: z.string()
            .uuid('Invalid document ID format'),
    }),
});

export const documentUpdateSchema = z.object({
    params: z.object({
        id: z.string()
            .uuid('Invalid document ID format'),
    }),
    body: z.object({
        title: z.string()
            .min(1, 'Title must be at least 1 character')
            .max(500, 'Title must not exceed 500 characters')
            .optional(),
        tags: z.array(z.string())
            .max(50, 'Cannot have more than 50 tags')
            .optional(),
        metadata: z.record(z.unknown())
            .optional(),
    }),
});

// ============================================================================
// SEARCH SCHEMAS
// ============================================================================

export const searchQuerySchema = z.object({
    query: z.object({
        q: z.string()
            .min(1, 'Search query is required')
            .max(500, 'Search query must not exceed 500 characters'),
        limit: z.string()
            .optional()
            .default('10')
            .transform(val => parseInt(val, 10))
            .refine(val => val > 0 && val <= 100, 'Limit must be between 1 and 100'),
        offset: z.string()
            .optional()
            .default('0')
            .transform(val => parseInt(val, 10))
            .refine(val => val >= 0, 'Offset must be non-negative'),
    }),
});

export const semanticSearchQuerySchema = z.object({
    query: z.object({
        q: z.string()
            .min(1, 'Search query is required')
            .max(500, 'Search query must not exceed 500 characters'),
        limit: z.string()
            .optional()
            .default('10')
            .transform(val => parseInt(val, 10))
            .refine(val => val > 0 && val <= 100, 'Limit must be between 1 and 100'),
        scoreThreshold: z.string()
            .optional()
            .default('0.7')
            .transform(val => parseFloat(val))
            .refine(val => val >= 0 && val <= 1, 'Score threshold must be between 0 and 1'),
    }),
});

export const hybridSearchQuerySchema = z.object({
    query: z.object({
        q: z.string()
            .min(1, 'Search query is required')
            .max(500, 'Search query must not exceed 500 characters'),
        limit: z.string()
            .optional()
            .default('10')
            .transform(val => parseInt(val, 10))
            .refine(val => val > 0 && val <= 100, 'Limit must be between 1 and 100'),
        semanticWeight: z.string()
            .optional()
            .default('0.5')
            .transform(val => parseFloat(val))
            .refine(val => val >= 0 && val <= 1, 'Semantic weight must be between 0 and 1'),
    }),
});

export const suggestionsQuerySchema = z.object({
    query: z.object({
        q: z.string()
            .min(1, 'Query prefix is required')
            .max(100, 'Query prefix must not exceed 100 characters'),
        limit: z.string()
            .optional()
            .default('5')
            .transform(val => parseInt(val, 10))
            .refine(val => val > 0 && val <= 20, 'Limit must be between 1 and 20'),
    }),
});

// ============================================================================
// TYPE INFERENCE EXPORTS
// ============================================================================

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type DocumentListQuery = z.infer<typeof documentListQuerySchema>;
export type DocumentIdParam = z.infer<typeof documentIdParamSchema>;
export type DocumentUpdateInput = z.infer<typeof documentUpdateSchema>;
export type SearchQuery = z.infer<typeof searchQuerySchema>;
export type SemanticSearchQuery = z.infer<typeof semanticSearchQuerySchema>;
export type HybridSearchQuery = z.infer<typeof hybridSearchQuerySchema>;
export type SuggestionsQuery = z.infer<typeof suggestionsQuerySchema>;
