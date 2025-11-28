import { validate } from '../../middleware/validation';
import { registerSchema, loginSchema, searchQuerySchema } from '../../validation/schemas';
import { Request, Response, NextFunction } from 'express';

describe('Validation Middleware Unit Tests', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let mockNext: NextFunction;

    beforeEach(() => {
        mockRequest = {
            body: {},
            query: {},
            params: {},
        };
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };
        mockNext = jest.fn();
    });

    describe('validate() middleware factory', () => {
        it('should call next() with valid data', async () => {
            mockRequest.body = {
                email: 'test@example.com',
                password: 'SecurePass123',
            };

            const middleware = validate(registerSchema);
            await middleware(mockRequest as Request, mockResponse as Response, mockNext);

            expect(mockNext).toHaveBeenCalled();
            expect(mockResponse.status).not.toHaveBeenCalled();
        });

        it('should return 400 with invalid data', async () => {
            mockRequest.body = {
                email: 'invalid-email',
                password: 'weak',
            };

            const middleware = validate(registerSchema);
            await middleware(mockRequest as Request, mockResponse as Response, mockNext);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: 'Validation error',
                    message: 'Invalid request data',
                    details: expect.any(Array),
                })
            );
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should validate body data', async () => {
            mockRequest.body = {
                email: 'test@example.com',
                password: 'ValidPass123',
            };

            const middleware = validate(loginSchema);
            await middleware(mockRequest as Request, mockResponse as Response, mockNext);

            expect(mockNext).toHaveBeenCalled();
        });

        it('should validate query parameters', async () => {
            mockRequest.query = {
                q: 'test query',
                limit: '10',
            };

            const middleware = validate(searchQuerySchema);
            await middleware(mockRequest as Request, mockResponse as Response, mockNext);

            expect(mockNext).toHaveBeenCalled();
        });

        it('should transform string numbers to integers', async () => {
            mockRequest.query = {
                q: 'test',
                limit: '25',
                offset: '10',
            };

            const middleware = validate(searchQuerySchema);
            await middleware(mockRequest as Request, mockResponse as Response, mockNext);

            expect(mockNext).toHaveBeenCalled();
            expect((mockRequest as any).query.limit).toBe(25);
            expect((mockRequest as any).query.offset).toBe(10);
        });

        it('should attach validated data to request', async () => {
            mockRequest.body = {
                email: 'test@example.com',
                password: 'SecurePass123',
            };

            const middleware = validate(registerSchema);
            await middleware(mockRequest as Request, mockResponse as Response, mockNext);

            expect((mockRequest as any).validated).toBeDefined();
            expect(mockNext).toHaveBeenCalled();
        });
    });

    describe('Error formatting', () => {
        it('should format validation errors with field paths', async () => {
            mockRequest.body = {
                email: 'invalid',
            };

            const middleware = validate(registerSchema);
            await middleware(mockRequest as Request, mockResponse as Response, mockNext);

            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    details: expect.arrayContaining([
                        expect.objectContaining({
                            field: expect.any(String),
                            message: expect.any(String),
                            code: expect.any(String),
                        }),
                    ]),
                })
            );
        });

        it('should include error codes', async () => {
            mockRequest.body = {
                email: 'not-an-email',
                password: 'weak',
            };

            const middleware = validate(registerSchema);
            await middleware(mockRequest as Request, mockResponse as Response, mockNext);

            const callArgs = (mockResponse.json as jest.Mock).mock.calls[0][0];
            expect(callArgs.details[0]).toHaveProperty('code');
        });

        it('should provide clear error messages', async () => {
            mockRequest.body = {
                email: 'test@example.com',
                password: 'NoNumber',
            };

            const middleware = validate(registerSchema);
            await middleware(mockRequest as Request, mockResponse as Response, mockNext);

            const callArgs = (mockResponse.json as jest.Mock).mock.calls[0][0];
            expect(callArgs.details.some((d: any) =>
                d.message.toLowerCase().includes('number')
            )).toBe(true);
        });
    });

    describe('Edge cases', () => {
        it('should handle empty request data', async () => {
            const middleware = validate(registerSchema);
            await middleware(mockRequest as Request, mockResponse as Response, mockNext);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
        });

        it('should handle extra fields gracefully', async () => {
            mockRequest.body = {
                email: 'test@example.com',
                password: 'SecurePass123',
                extraField: 'should be ignored',
            };

            const middleware = validate(registerSchema);
            await middleware(mockRequest as Request, mockResponse as Response, mockNext);

            expect(mockNext).toHaveBeenCalled();
        });

        it('should handle null values', async () => {
            mockRequest.body = {
                email: null,
                password: 'SecurePass123',
            };

            const middleware = validate(registerSchema);
            await middleware(mockRequest as Request, mockResponse as Response, mockNext);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
        });

        it('should handle undefined values', async () => {
            mockRequest.body = {
                email: undefined,
                password: 'SecurePass123',
            };

            const middleware = validate(registerSchema);
            await middleware(mockRequest as Request, mockResponse as Response, mockNext);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
        });
    });
});
