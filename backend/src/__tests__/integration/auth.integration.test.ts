import request from 'supertest';
import app from '../../index';
import { AppDataSource } from '../../config/database';
import { User } from '../../models/User';

describe('Auth Integration Tests', () => {
    let authToken: string;
    let userId: string;

    beforeAll(async () => {
        // Wait for database connection
        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }
    });

    afterAll(async () => {
        // Clean up test data
        if (AppDataSource.isInitialized) {
            const userRepository = AppDataSource.getRepository(User);
            await userRepository.delete({ email: 'test@integration.com' });
            await userRepository.delete({ email: 'test2@integration.com' });
        }
    });

    describe('POST /api/v1/auth/register', () => {
        it('should register a new user with valid data', async () => {
            const response = await request(app)
                .post('/api/v1/auth/register')
                .send({
                    email: 'test@integration.com',
                    password: 'SecurePass123',
                    fullName: 'Test User',
                });

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('message', 'Registration successful');
            expect(response.body).toHaveProperty('user');
            expect(response.body).toHaveProperty('token');
            expect(response.body.user.email).toBe('test@integration.com');

            authToken = response.body.token;
            userId = response.body.user.id;
        });

        it('should fail with duplicate email', async () => {
            const response = await request(app)
                .post('/api/v1/auth/register')
                .send({
                    email: 'test@integration.com',
                    password: 'SecurePass123',
                    fullName: 'Duplicate User',
                });

            expect(response.status).toBe(409);
            expect(response.body).toHaveProperty('error', 'Conflict');
        });

        it('should fail with invalid email format', async () => {
            const response = await request(app)
                .post('/api/v1/auth/register')
                .send({
                    email: 'invalid-email',
                    password: 'SecurePass123',
                });

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error', 'Validation error');
            expect(response.body.details).toContainEqual(
                expect.objectContaining({ field: 'body.email' })
            );
        });

        it('should fail with weak password', async () => {
            const response = await request(app)
                .post('/api/v1/auth/register')
                .send({
                    email: 'test2@integration.com',
                    password: 'weak',
                });

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error', 'Validation error');
        });

        it('should fail with missing required fields', async () => {
            const response = await request(app)
                .post('/api/v1/auth/register')
                .send({});

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error', 'Validation error');
        });
    });

    describe('POST /api/v1/auth/login', () => {
        it('should login with valid credentials', async () => {
            const response = await request(app)
                .post('/api/v1/auth/login')
                .send({
                    email: 'test@integration.com',
                    password: 'SecurePass123',
                });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('message', 'Login successful');
            expect(response.body).toHaveProperty('user');
            expect(response.body).toHaveProperty('token');
        });

        it('should fail with incorrect password', async () => {
            const response = await request(app)
                .post('/api/v1/auth/login')
                .send({
                    email: 'test@integration.com',
                    password: 'WrongPassword123',
                });

            expect(response.status).toBe(401);
            expect(response.body).toHaveProperty('error', 'Unauthorized');
        });

        it('should fail with non-existent email', async () => {
            const response = await request(app)
                .post('/api/v1/auth/login')
                .send({
                    email: 'nonexistent@example.com',
                    password: 'SecurePass123',
                });

            expect(response.status).toBe(401);
        });

        it('should fail with invalid email format', async () => {
            const response = await request(app)
                .post('/api/v1/auth/login')
                .send({
                    email: 'invalid-email',
                    password: 'SecurePass123',
                });

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error', 'Validation error');
        });
    });

    describe('GET /api/v1/auth/me', () => {
        it('should get current user profile with valid token', async () => {
            const response = await request(app)
                .get('/api/v1/auth/me')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('user');
            expect(response.body.user.email).toBe('test@integration.com');
        });

        it('should fail without authentication token', async () => {
            const response = await request(app)
                .get('/api/v1/auth/me');

            expect(response.status).toBe(401);
        });

        it('should fail with invalid token', async () => {
            const response = await request(app)
                .get('/api/v1/auth/me')
                .set('Authorization', 'Bearer invalid-token');

            expect(response.status).toBe(401);
        });
    });

    describe('PATCH /api/v1/auth/profile', () => {
        it('should update user profile with valid data', async () => {
            const response = await request(app)
                .patch('/api/v1/auth/profile')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    fullName: 'Updated Name',
                });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('message', 'Profile updated successfully');
            expect(response.body.user.fullName).toBe('Updated Name');
        });

        it('should fail without authentication', async () => {
            const response = await request(app)
                .patch('/api/v1/auth/profile')
                .send({
                    fullName: 'Updated Name',
                });

            expect(response.status).toBe(401);
        });

        it('should fail with invalid fullName length', async () => {
            const response = await request(app)
                .patch('/api/v1/auth/profile')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    fullName: 'A', // Too short
                });

            expect(response.status).toBe(400);
        });
    });

    describe('POST /api/v1/auth/change-password', () => {
        it('should change password with valid credentials', async () => {
            const response = await request(app)
                .post('/api/v1/auth/change-password')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    currentPassword: 'SecurePass123',
                    newPassword: 'NewSecurePass123',
                });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('message', 'Password changed successfully');

            // Verify can login with new password
            const loginResponse = await request(app)
                .post('/api/v1/auth/login')
                .send({
                    email: 'test@integration.com',
                    password: 'NewSecurePass123',
                });

            expect(loginResponse.status).toBe(200);
        });

        it('should fail with incorrect current password', async () => {
            const response = await request(app)
                .post('/api/v1/auth/change-password')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    currentPassword: 'WrongPassword123',
                    newPassword: 'NewSecurePass456',
                });

            expect(response.status).toBe(400);
        });

        it('should fail with weak new password', async () => {
            const response = await request(app)
                .post('/api/v1/auth/change-password')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    currentPassword: 'NewSecurePass123',
                    newPassword: 'weak',
                });

            expect(response.status).toBe(400);
        });

        it('should fail without authentication', async () => {
            const response = await request(app)
                .post('/api/v1/auth/change-password')
                .send({
                    currentPassword: 'SecurePass123',
                    newPassword: 'NewSecurePass123',
                });

            expect(response.status).toBe(401);
        });
    });

    describe('Rate Limiting', () => {
        it('should rate limit excessive login attempts', async () => {
            // Make 6 rapid requests (limit is 5)
            const requests = Array(6).fill(null).map(() =>
                request(app)
                    .post('/api/v1/auth/login')
                    .send({
                        email: 'test@integration.com',
                        password: 'WrongPassword',
                    })
            );

            const responses = await Promise.all(requests);
            const rateLimited = responses.some(r => r.status === 429);

            expect(rateLimited).toBe(true);
        }, 30000);
    });
});
