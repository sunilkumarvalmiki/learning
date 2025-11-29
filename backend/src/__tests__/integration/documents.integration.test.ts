import request from 'supertest';
import express from 'express';
import { initializeTestDb, closeTestDb, getDataSource } from '../helpers/testDb';
import documentRoutes from '../../routes/documents';
import { DocumentService } from '../../services/DocumentService';
import { User, UserRole } from '../../models/User';

// Mock the database config
jest.mock('../../config/database', () => ({
    get AppDataSource() {
        return getDataSource();
    },
}));

// Mock config
jest.mock('../../config', () => ({
    jwt: { secret: 'test-secret', expiresIn: '1h' },
    minio: { endPoint: 'localhost', port: 9000, useSSL: false, accessKey: 'test', secretKey: 'test' },
}));

// Mock MinIO client
jest.mock('minio', () => ({
    Client: jest.fn().mockImplementation(() => ({
        bucketExists: jest.fn().mockResolvedValue(true),
        makeBucket: jest.fn().mockResolvedValue(true),
        putObject: jest.fn().mockResolvedValue({ etag: 'test-etag' }),
        getObject: jest.fn().mockResolvedValue({
            pipe: jest.fn(),
            on: jest.fn(),
        }),
        removeObject: jest.fn().mockResolvedValue(true),
    })),
}));

// Mock Neo4j driver
jest.mock('neo4j-driver', () => ({
    driver: jest.fn().mockReturnValue({
        session: jest.fn().mockReturnValue({
            run: jest.fn().mockResolvedValue({ records: [] }),
            close: jest.fn(),
        }),
        close: jest.fn(),
    }),
    auth: { basic: jest.fn() },
}));

// Mock Qdrant client
jest.mock('@qdrant/js-client-rest', () => ({
    QdrantClient: jest.fn().mockImplementation(() => ({
        getCollections: jest.fn().mockResolvedValue({ collections: [] }),
        createCollection: jest.fn().mockResolvedValue(true),
        upsert: jest.fn().mockResolvedValue(true),
        search: jest.fn().mockResolvedValue([]),
    })),
}));

const app = express();
app.use(express.json());
// Mock auth middleware to inject a user
app.use((req, res, next) => {
    (req as any).user = { id: 'test-user-id', role: 'user' };
    (req as any).userId = 'test-user-id';
    next();
});
app.use('/api/v1/documents', documentRoutes);

describe('Document Integration Tests', () => {
    let user: User;

    beforeAll(async () => {
        const ds = await initializeTestDb();
        // Create a test user
        user = ds.getRepository(User).create({
            id: 'test-user-id',
            email: 'test@example.com',
            passwordHash: 'hash',
            fullName: 'Test User',
            role: UserRole.FREE,
        });
        await ds.getRepository(User).save(user);
    });

    afterAll(async () => {
        await closeTestDb();
    });

    describe('POST /api/v1/documents/upload', () => {
        it('should upload a document', async () => {
            const res = await request(app)
                .post('/api/v1/documents/upload')
                .attach('file', Buffer.from('test content'), 'test.txt');

            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('document');
            expect(res.body.document).toHaveProperty('title', 'test.txt');
        });
    });

    describe('GET /api/v1/documents', () => {
        it('should list documents', async () => {
            const res = await request(app).get('/api/v1/documents');
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('documents');
            expect(Array.isArray(res.body.documents)).toBe(true);
        });
    });
});
