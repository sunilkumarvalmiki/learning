import {
    registerSchema,
    loginSchema,
    updateProfileSchema,
    changePasswordSchema,
    documentListQuerySchema,
    documentIdParamSchema,
    documentUpdateSchema,
    searchQuerySchema,
    semanticSearchQuerySchema,
    hybridSearchQuerySchema,
    suggestionsQuerySchema,
} from '../../validation/schemas';

describe('Validation Schemas Unit Tests', () => {
    describe('registerSchema', () => {
        it('should accept valid registration data', () => {
            const result = registerSchema.safeParse({
                body: {
                    email: 'test@example.com',
                    password: 'SecurePass123',
                    fullName: 'Test User',
                },
            });

            expect(result.success).toBe(true);
        });

        it('should reject invalid email', () => {
            const result = registerSchema.safeParse({
                body: {
                    email: 'not-an-email',
                    password: 'SecurePass123',
                },
            });

            expect(result.success).toBe(false);
        });

        it('should reject weak password', () => {
            const result = registerSchema.safeParse({
                body: {
                    email: 'test@example.com',
                    password: 'weak',
                },
            });

            expect(result.success).toBe(false);
        });

        it('should require uppercase in password', () => {
            const result = registerSchema.safeParse({
                body: {
                    email: 'test@example.com',
                    password: 'noupppercase123',
                },
            });

            expect(result.success).toBe(false);
        });

        it('should require lowercase in password', () => {
            const result = registerSchema.safeParse({
                body: {
                    email: 'test@example.com',
                    password: 'NOLOWERCASE123',
                },
            });

            expect(result.success).toBe(false);
        });

        it('should require number in password', () => {
            const result = registerSchema.safeParse({
                body: {
                    email: 'test@example.com',
                    password: 'NoNumberHere',
                },
            });

            expect(result.success).toBe(false);
        });

        it('should make fullName optional', () => {
            const result = registerSchema.safeParse({
                body: {
                    email: 'test@example.com',
                    password: 'SecurePass123',
                },
            });

            expect(result.success).toBe(true);
        });
    });

    describe('loginSchema', () => {
        it('should accept valid login data', () => {
            const result = loginSchema.safeParse({
                body: {
                    email: 'test@example.com',
                    password: 'anypassword',
                },
            });

            expect(result.success).toBe(true);
        });

        it('should reject invalid email', () => {
            const result = loginSchema.safeParse({
                body: {
                    email: 'invalid',
                    password: 'password',
                },
            });

            expect(result.success).toBe(false);
        });
    });

    describe('documentListQuerySchema', () => {
        it('should accept valid query parameters', () => {
            const result = documentListQuerySchema.safeParse({
                query: {
                    page: '1',
                    limit: '20',
                    status: 'completed',
                },
            });

            expect(result.success).toBe(true);
        });

        it('should transform string numbers', () => {
            const result = documentListQuerySchema.safeParse({
                query: {
                    page: '2',
                    limit: '10',
                },
            });

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.query.page).toBe(2);
                expect(result.data.query.limit).toBe(10);
            }
        });

        it('should reject invalid status enum', () => {
            const result = documentListQuerySchema.safeParse({
                query: {
                    status: 'invalid-status',
                },
            });

            expect(result.success).toBe(false);
        });

        it('should reject limit exceeding maximum', () => {
            const result = documentListQuerySchema.safeParse({
                query: {
                    limit: '101',
                },
            });

            expect(result.success).toBe(false);
        });

        it('should reject negative page', () => {
            const result = documentListQuerySchema.safeParse({
                query: {
                    page: '0',
                },
            });

            expect(result.success).toBe(false);
        });
    });

    describe('documentIdParamSchema', () => {
        it('should accept valid UUID', () => {
            const result = documentIdParamSchema.safeParse({
                params: {
                    id: '550e8400-e29b-41d4-a716-446655440000',
                },
            });

            expect(result.success).toBe(true);
        });

        it('should reject invalid UUID', () => {
            const result = documentIdParamSchema.safeParse({
                params: {
                    id: 'not-a-uuid',
                },
            });

            expect(result.success).toBe(false);
        });
    });

    describe('searchQuerySchema', () => {
        it('should accept valid search query', () => {
            const result = searchQuerySchema.safeParse({
                query: {
                    q: 'test query',
                    limit: '10',
                    offset: '0',
                },
            });

            expect(result.success).toBe(true);
        });

        it('should require query parameter', () => {
            const result = searchQuerySchema.safeParse({
                query: {},
            });

            expect(result.success).toBe(false);
        });

        it('should reject query exceeding max length', () => {
            const result = searchQuerySchema.safeParse({
                query: {
                    q: 'a'.repeat(501),
                },
            });

            expect(result.success).toBe(false);
        });
    });

    describe('semanticSearchQuerySchema', () => {
        it('should accept valid score threshold', () => {
            const result = semanticSearchQuerySchema.safeParse({
                query: {
                    q: 'test',
                    scoreThreshold: '0.7',
                },
            });

            expect(result.success).toBe(true);
        });

        it('should reject score threshold > 1', () => {
            const result = semanticSearchQuerySchema.safeParse({
                query: {
                    q: 'test',
                    scoreThreshold: '1.5',
                },
            });

            expect(result.success).toBe(false);
        });

        it('should reject negative score threshold', () => {
            const result = semanticSearchQuerySchema.safeParse({
                query: {
                    q: 'test',
                    scoreThreshold: '-0.1',
                },
            });

            expect(result.success).toBe(false);
        });
    });

    describe('hybridSearchQuerySchema', () => {
        it('should accept valid semantic weight', () => {
            const result = hybridSearchQuerySchema.safeParse({
                query: {
                    q: 'test',
                    semanticWeight: '0.5',
                },
            });

            expect(result.success).toBe(true);
        });

        it('should use default semantic weight', () => {
            const result = hybridSearchQuerySchema.safeParse({
                query: {
                    q: 'test',
                },
            });

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.query.semanticWeight).toBe(0.5);
            }
        });
    });

    describe('suggestionsQuerySchema', () => {
        it('should accept valid suggestions query', () => {
            const result = suggestionsQuerySchema.safeParse({
                query: {
                    q: 'test',
                    limit: '5',
                },
            });

            expect(result.success).toBe(true);
        });

        it('should reject limit exceeding maximum', () => {
            const result = suggestionsQuerySchema.safeParse({
                query: {
                    q: 'test',
                    limit: '21',
                },
            });

            expect(result.success).toBe(false);
        });
    });
});
