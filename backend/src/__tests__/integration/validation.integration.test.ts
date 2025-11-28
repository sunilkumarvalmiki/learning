import request from 'supertest';
import app from '../../index';

describe('Validation Integration Tests', () => {
    describe('Request Validation Middleware', () => {
        it('should validate email format in registration', async () => {
            const response = await request(app)
                .post('/api/v1/auth/register')
                .send({
                    email: 'not-an-email',
                    password: 'SecurePass123',
                });

            expect(response.status).toBe(400);
            expect(response.body.error).toBe('Validation error');
            expect(response.body.details).toBeDefined();
            expect(response.body.details).toContainEqual(
                expect.objectContaining({
                    field: 'body.email',
                    message: expect.stringContaining('email'),
                })
            );
        });

        it('should validate password complexity', async () => {
            const response = await request(app)
                .post('/api/v1/auth/register')
                .send({
                    email: 'test@example.com',
                    password: 'weak',
                });

            expect(response.status).toBe(400);
            expect(response.body.details).toBeDefined();
        });

        it('should validate UUID format for document ID', async () => {
            const response = await request(app)
                .get('/api/v1/documents/not-a-uuid');

            expect(response.status).toBe(400);
            expect(response.body.details).toContainEqual(
                expect.objectContaining({
                    field: 'params.id',
                })
            );
        });

        it('should validate query parameter types', async () => {
            const response = await request(app)
                .get('/api/v1/documents')
                .query({ page: 'not-a-number' });

            expect(response.status).toBe(400);
        });

        it('should validate query parameter ranges', async () => {
            const response = await request(app)
                .get('/api/v1/documents')
                .query({ limit: '101' }); // Max is 100

            expect(response.status).toBe(400);
        });

        it('should validate enum values', async () => {
            const response = await request(app)
                .get('/api/v1/documents')
                .query({ status: 'invalid-status' });

            expect(response.status).toBe(400);
        });

        it('should validate array max items', async () => {
            const response = await request(app)
                .patch('/api/v1/documents/550e8400-e29b-41d4-a716-446655440000')
                .send({
                    tags: Array(51).fill('tag'), // Max is 50
                });

            expect(response.status).toBe(400);
        });

        it('should validate string length constraints', async () => {
            const response = await request(app)
                .get('/api/v1/search')
                .query({ q: 'a'.repeat(501) }); // Max is 500

            expect(response.status).toBe(400);
        });

        it('should validate required fields', async () => {
            const response = await request(app)
                .post('/api/v1/auth/login')
                .send({});

            expect(response.status).toBe(400);
            expect(response.body.details.length).toBeGreaterThan(0);
        });

        it('should allow valid optional fields', async () => {
            const response = await request(app)
                .get('/api/v1/documents')
                .query({ page: '1' }); // Optional query params

            expect([200, 401]).toContain(response.status); // May need auth
        });
    });

    describe('Type Coercion', () => {
        it('should convert string page to number', async () => {
            const response = await request(app)
                .get('/api/v1/documents')
                .query({ page: '2', limit: '10' });

            // Should not error on type conversion
            expect([200, 401]).toContain(response.status);
        });

        it('should convert string limit to number', async () => {
            const response = await request(app)
                .get('/api/v1/search')
                .query({ q: 'test', limit: '5' });

            expect(response.status).toBe(200);
        });

        it('should convert string scoreThreshold to float', async () => {
            const response = await request(app)
                .get('/api/v1/search/semantic')
                .query({ q: 'test', scoreThreshold: '0.7' });

            expect(response.status).toBe(200);
        });
    });

    describe('Error Message Quality', () => {
        it('should provide detailed validation errors', async () => {
            const response = await request(app)
                .post('/api/v1/auth/register')
                .send({
                    email: 'invalid',
                    password: 'weak',
                });

            expect(response.status).toBe(400);
            expect(response.body.error).toBe('Validation error');
            expect(response.body.message).toBe('Invalid request data');
            expect(response.body.details).toBeDefined();
            expect(response.body.details.length).toBeGreaterThan(0);
            expect(response.body.details[0]).toHaveProperty('field');
            expect(response.body.details[0]).toHaveProperty('message');
            expect(response.body.details[0]).toHaveProperty('code');
        });

        it('should provide user-friendly error messages', async () => {
            const response = await request(app)
                .post('/api/v1/auth/register')
                .send({
                    email: 'test@example.com',
                    password: 'NoNumber',
                });

            expect(response.status).toBe(400);
            expect(response.body.details).toContainEqual(
                expect.objectContaining({
                    message: expect.stringContaining('number'),
                })
            );
        });
    });

    describe('Security Validation', () => {
        it('should sanitize potentially malicious input', async () => {
            const response = await request(app)
                .get('/api/v1/search')
                .query({ q: '<script>alert("xss")</script>' });

            // Should not error, query should be processed safely
            expect(response.status).toBe(200);
        });

        it('should reject excessively long strings', async () => {
            const response = await request(app)
                .get('/api/v1/search')
                .query({ q: 'a'.repeat(1000) });

            expect(response.status).toBe(400);
        });

        it('should validate against SQL injection patterns', async () => {
            const response = await request(app)
                .get('/api/v1/search')
                .query({ q: "'; DROP TABLE users; --" });

            // Should handle safely (validation or safe query execution)
            expect([200, 400]).toContain(response.status);
        });
    });
});
