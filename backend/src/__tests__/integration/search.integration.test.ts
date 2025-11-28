import request from 'supertest';
import app from '../../index';

describe('Search Integration Tests', () => {
    describe('GET /api/v1/search', () => {
        it('should perform full-text search with valid query', async () => {
            const response = await request(app)
                .get('/api/v1/search')
                .query({ q: 'test query' });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('results');
            expect(Array.isArray(response.body.results)).toBe(true);
        });

        it('should fail without search query', async () => {
            const response = await request(app)
                .get('/api/v1/search');

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error', 'Validation error');
        });

        it('should fail with query too long', async () => {
            const response = await request(app)
                .get('/api/v1/search')
                .query({ q: 'a'.repeat(501) });

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error', 'Validation error');
        });

        it('should respect limit parameter', async () => {
            const response = await request(app)
                .get('/api/v1/search')
                .query({ q: 'test', limit: '5' });

            expect(response.status).toBe(200);
            if (response.body.results) {
                expect(response.body.results.length).toBeLessThanOrEqual(5);
            }
        });

        it('should respect offset parameter', async () => {
            const response = await request(app)
                .get('/api/v1/search')
                .query({ q: 'test', offset: '10' });

            expect(response.status).toBe(200);
        });

        it('should fail with invalid limit', async () => {
            const response = await request(app)
                .get('/api/v1/search')
                .query({ q: 'test', limit: '101' }); // Max is 100

            expect(response.status).toBe(400);
        });

        it('should fail with negative offset', async () => {
            const response = await request(app)
                .get('/api/v1/search')
                .query({ q: 'test', offset: '-1' });

            expect(response.status).toBe(400);
        });
    });

    describe('GET /api/v1/search/semantic', () => {
        it('should perform semantic search with valid query', async () => {
            const response = await request(app)
                .get('/api/v1/search/semantic')
                .query({ q: 'artificial intelligence' });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('results');
        });

        it('should fail without query', async () => {
            const response = await request(app)
                .get('/api/v1/search/semantic');

            expect(response.status).toBe(400);
        });

        it('should respect scoreThreshold parameter', async () => {
            const response = await request(app)
                .get('/api/v1/search/semantic')
                .query({ q: 'machine learning', scoreThreshold: '0.8' });

            expect(response.status).toBe(200);
        });

        it('should fail with invalid scoreThreshold', async () => {
            const response = await request(app)
                .get('/api/v1/search/semantic')
                .query({ q: 'test', scoreThreshold: '1.5' }); // Max is 1.0

            expect(response.status).toBe(400);
        });
    });

    describe('GET /api/v1/search/hybrid', () => {
        it('should perform hybrid search with valid query', async () => {
            const response = await request(app)
                .get('/api/v1/search/hybrid')
                .query({ q: 'deep learning' });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('results');
        });

        it('should respect semanticWeight parameter', async () => {
            const response = await request(app)
                .get('/api/v1/search/hybrid')
                .query({ q: 'neural networks', semanticWeight: '0.7' });

            expect(response.status).toBe(200);
        });

        it('should fail with invalid semanticWeight', async () => {
            const response = await request(app)
                .get('/api/v1/search/hybrid')
                .query({ q: 'test', semanticWeight: '2.0' });

            expect(response.status).toBe(400);
        });

        it('should fail without query', async () => {
            const response = await request(app)
                .get('/api/v1/search/hybrid');

            expect(response.status).toBe(400);
        });
    });

    describe('GET /api/v1/search/suggestions', () => {
        it('should get search suggestions with valid prefix', async () => {
            const response = await request(app)
                .get('/api/v1/search/suggestions')
                .query({ q: 'mach' });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('suggestions');
            expect(Array.isArray(response.body.suggestions)).toBe(true);
        });

        it('should fail without query prefix', async () => {
            const response = await request(app)
                .get('/api/v1/search/suggestions');

            expect(response.status).toBe(400);
        });

        it('should respect limit parameter', async () => {
            const response = await request(app)
                .get('/api/v1/search/suggestions')
                .query({ q: 'test', limit: '3' });

            expect(response.status).toBe(200);
            if (response.body.suggestions) {
                expect(response.body.suggestions.length).toBeLessThanOrEqual(3);
            }
        });

        it('should fail with query too long', async () => {
            const response = await request(app)
                .get('/api/v1/search/suggestions')
                .query({ q: 'a'.repeat(101) });

            expect(response.status).toBe(400);
        });

        it('should fail with limit exceeding maximum', async () => {
            const response = await request(app)
                .get('/api/v1/search/suggestions')
                .query({ q: 'test', limit: '21' }); // Max is 20

            expect(response.status).toBe(400);
        });
    });

    describe('Rate Limiting', () => {
        it('should rate limit excessive search requests', async () => {
            // Make 31 rapid requests (limit is 30 per minute)
            const requests = Array(31).fill(null).map(() =>
                request(app)
                    .get('/api/v1/search')
                    .query({ q: 'test' })
            );

            const responses = await Promise.all(requests);
            const rateLimited = responses.some(r => r.status === 429);

            expect(rateLimited).toBe(true);
        }, 30000);
    });
});
