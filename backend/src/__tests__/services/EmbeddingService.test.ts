import { EmbeddingService } from '../../services/EmbeddingService';

describe('EmbeddingService', () => {
    let embeddingService: EmbeddingService;

    beforeEach(() => {
        embeddingService = new EmbeddingService();
    });

    describe('isConfigured', () => {
        it('should return true (always configured with fallback)', () => {
            expect(embeddingService.isConfigured()).toBe(true);
        });
    });

    describe('splitIntoChunks', () => {
        const documentId = 'test-doc-id';
        const userId = 'test-user-id';

        it('should split short text into a single chunk', () => {
            const text = 'This is a short text.';
            const chunks = embeddingService.splitIntoChunks(text, documentId, userId);

            expect(chunks).toHaveLength(1);
            expect(chunks[0].content).toBe(text);
            expect(chunks[0].metadata.documentId).toBe(documentId);
            expect(chunks[0].metadata.userId).toBe(userId);
            expect(chunks[0].metadata.chunkIndex).toBe(0);
        });

        it('should split long text into multiple chunks', () => {
            // Create text longer than chunk size (1000 chars)
            const longText = 'Lorem ipsum dolor sit amet. '.repeat(100);
            const chunks = embeddingService.splitIntoChunks(longText, documentId, userId);

            expect(chunks.length).toBeGreaterThan(1);

            // Verify chunk indices are sequential
            chunks.forEach((chunk, index) => {
                expect(chunk.metadata.chunkIndex).toBe(index);
            });
        });

        it('should include metadata in chunks', () => {
            const text = 'Test content for metadata';
            const fileType = 'pdf';
            const title = 'Test Document';

            const chunks = embeddingService.splitIntoChunks(
                text, documentId, userId, fileType, title
            );

            expect(chunks[0].metadata.fileType).toBe(fileType);
            expect(chunks[0].metadata.title).toBe(title);
            expect(chunks[0].metadata.startChar).toBe(0);
        });

        it('should handle empty text', () => {
            const chunks = embeddingService.splitIntoChunks('', documentId, userId);
            expect(chunks).toHaveLength(0);
        });

        it('should handle whitespace-only text', () => {
            const chunks = embeddingService.splitIntoChunks('   \n\t  ', documentId, userId);
            expect(chunks).toHaveLength(0);
        });

        it('should prefer breaking at sentence boundaries', () => {
            // Create text with clear sentence boundaries
            const text = 'First sentence. '.repeat(40) + 'Second part starts here.';
            const chunks = embeddingService.splitIntoChunks(text, documentId, userId);

            // First chunk should end at a period if possible
            if (chunks.length > 1) {
                const firstChunk = chunks[0].content;
                expect(firstChunk.endsWith('.')).toBe(true);
            }
        });
    });

    describe('generateEmbedding (mock fallback)', () => {
        it('should generate embedding with correct dimensions', async () => {
            const result = await embeddingService.generateEmbedding('test text');

            expect(result.embedding).toHaveLength(384);
            expect(result.tokens).toBeGreaterThan(0);
        });

        it('should generate different embeddings for different texts', async () => {
            const result1 = await embeddingService.generateEmbedding('machine learning');
            const result2 = await embeddingService.generateEmbedding('cooking recipes');

            // Embeddings should be different
            const areDifferent = result1.embedding.some(
                (val, idx) => val !== result2.embedding[idx]
            );
            expect(areDifferent).toBe(true);
        });

        it('should generate similar embeddings for similar texts', async () => {
            const result1 = await embeddingService.generateEmbedding('machine learning algorithms');
            const result2 = await embeddingService.generateEmbedding('machine learning models');

            // Calculate cosine similarity
            const dotProduct = result1.embedding.reduce(
                (sum, val, idx) => sum + val * result2.embedding[idx], 0
            );
            const mag1 = Math.sqrt(result1.embedding.reduce((sum, val) => sum + val * val, 0));
            const mag2 = Math.sqrt(result2.embedding.reduce((sum, val) => sum + val * val, 0));
            const similarity = dotProduct / (mag1 * mag2);

            // Similar texts should have higher similarity (> 0.5)
            expect(similarity).toBeGreaterThan(0.5);
        });

        it('should handle empty text', async () => {
            const result = await embeddingService.generateEmbedding('');

            expect(result.embedding).toHaveLength(384);
            expect(result.tokens).toBe(0);
        });

        it('should truncate very long text', async () => {
            const longText = 'a'.repeat(5000);
            const result = await embeddingService.generateEmbedding(longText);

            expect(result.embedding).toHaveLength(384);
            // Tokens should be based on truncated text (2000 chars max)
            expect(result.tokens).toBeLessThanOrEqual(500);
        });

        it('should generate normalized embeddings', async () => {
            const result = await embeddingService.generateEmbedding('test normalization');

            // Check that embedding is normalized (magnitude ~= 1)
            const magnitude = Math.sqrt(
                result.embedding.reduce((sum, val) => sum + val * val, 0)
            );
            expect(magnitude).toBeCloseTo(1, 5);
        });
    });

    describe('generateBatchEmbeddings', () => {
        it('should generate embeddings for multiple texts', async () => {
            const texts = ['text one', 'text two', 'text three'];
            const results = await embeddingService.generateBatchEmbeddings(texts);

            expect(results).toHaveLength(3);
            results.forEach(result => {
                expect(result.embedding).toHaveLength(384);
                expect(result.tokens).toBeGreaterThan(0);
            });
        });

        it('should handle empty array', async () => {
            const results = await embeddingService.generateBatchEmbeddings([]);
            expect(results).toHaveLength(0);
        });
    });
});
