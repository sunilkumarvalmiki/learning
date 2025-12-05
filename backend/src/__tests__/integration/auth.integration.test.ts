import request from 'supertest';
import express from 'express';
import { initializeTestDb, closeTestDb, getDataSource, isTestDbAvailable } from '../helpers/testDb';

// Skip tests if pg-mem is not available
const describeIfDbAvailable = isTestDbAvailable() ? describe : describe.skip;

// We only set up these tests if the db helper can initialize
describeIfDbAvailable('Auth Integration Tests', () => {
    let app: express.Application;

    beforeAll(async () => {
        const dataSource = await initializeTestDb();
        if (!dataSource) {
            console.warn('Skipping integration tests - database not available');
            return;
        }

        // Mock the database config
        jest.mock('../../config/database', () => ({
            get AppDataSource() {
                return getDataSource();
            },
        }));

        // Mock config to avoid env var issues
        jest.mock('../../config', () => ({
            jwt: {
                secret: 'test-secret',
                expiresIn: '1h',
            },
            postgres: {
                host: 'localhost',
                port: 5432,
                username: 'test',
                password: 'test',
                database: 'test',
            },
        }));

        const authRoutes = require('../../routes/auth').default;
        app = express();
        app.use(express.json());
        app.use('/api/v1/auth', authRoutes);
    });

    afterAll(async () => {
        await closeTestDb();
    });

    describe('POST /api/v1/auth/register', () => {
        it('should register a new user', async () => {
            const res = await request(app)
                .post('/api/v1/auth/register')
                .send({
                    email: 'test@example.com',
                    password: 'Password123!',
                    fullName: 'Test User',
                });

            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('token');
            expect(res.body.user).toHaveProperty('email', 'test@example.com');
        });

        it('should fail with invalid email', async () => {
            const res = await request(app)
                .post('/api/v1/auth/register')
                .send({
                    email: 'invalid-email',
                    password: 'Password123!',
                    fullName: 'Test User',
                });

            expect(res.status).toBe(400);
        });
    });

    describe('POST /api/v1/auth/login', () => {
        it('should login an existing user', async () => {
            // First register
            await request(app)
                .post('/api/v1/auth/register')
                .send({
                    email: 'login@example.com',
                    password: 'Password123!',
                    fullName: 'Login User',
                });

            // Then login
            const res = await request(app)
                .post('/api/v1/auth/login')
                .send({
                    email: 'login@example.com',
                    password: 'Password123!',
                });

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('token');
        });

        it('should fail with wrong password', async () => {
            const res = await request(app)
                .post('/api/v1/auth/login')
                .send({
                    email: 'login@example.com',
                    password: 'WrongPassword123!',
                });

            expect(res.status).toBe(401);
        });
    });
});
