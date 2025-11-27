import { TextExtractionService } from '../../services/TextExtractionService';

describe('TextExtractionService', () => {
    let textExtractionService: TextExtractionService;

    beforeEach(() => {
        textExtractionService = new TextExtractionService();
    });

    describe('generateSummary', () => {
        it('should return empty string for empty content', () => {
            const summary = textExtractionService.generateSummary('');
            expect(summary).toBe('');
        });

        it('should return empty string for null-like content', () => {
            const summary = textExtractionService.generateSummary(null as unknown as string);
            expect(summary).toBe('');
        });

        it('should return full content if shorter than maxLength', () => {
            const content = 'This is a short text.';
            const summary = textExtractionService.generateSummary(content, 500);
            expect(summary).toBe(content);
        });

        it('should truncate at sentence boundary when possible', () => {
            const content = 'First sentence. Second sentence. Third sentence is here.';
            const summary = textExtractionService.generateSummary(content, 35);

            // Should end at a sentence boundary
            expect(summary).toMatch(/\.$/);
            expect(summary.length).toBeLessThanOrEqual(35);
        });

        it('should add ellipsis if no good sentence boundary found', () => {
            const content = 'This is one very long sentence without any periods or breaks anywhere in it';
            const summary = textExtractionService.generateSummary(content, 30);

            expect(summary).toEndWith('...');
        });

        it('should normalize whitespace', () => {
            const content = 'Multiple   spaces\n\nand\nnewlines   here.';
            const summary = textExtractionService.generateSummary(content, 500);

            expect(summary).not.toContain('  '); // No double spaces
            expect(summary).not.toContain('\n'); // No newlines
        });

        it('should use default maxLength of 500', () => {
            const longContent = 'Word '.repeat(200); // ~1000 chars
            const summary = textExtractionService.generateSummary(longContent);

            expect(summary.length).toBeLessThanOrEqual(503); // 500 + '...'
        });

        it('should handle content with question marks as boundaries', () => {
            const content = 'Is this a question? Yes it is. More content here.';
            const summary = textExtractionService.generateSummary(content, 25);

            // Should find question mark or period as boundary
            expect(summary).toMatch(/[.?!]$/);
        });

        it('should handle content with exclamation marks as boundaries', () => {
            const content = 'Wow! This is amazing! More text follows.';
            const summary = textExtractionService.generateSummary(content, 10);

            expect(summary).toMatch(/[.?!]$|\.\.\.$/);
        });
    });
});

// Custom matcher for endsWith
expect.extend({
    toEndWith(received: string, expected: string) {
        const pass = received.endsWith(expected);
        return {
            message: () =>
                `expected "${received}" ${pass ? 'not ' : ''}to end with "${expected}"`,
            pass,
        };
    },
});

declare global {
    namespace jest {
        interface Matchers<R> {
            toEndWith(expected: string): R;
        }
    }
}
