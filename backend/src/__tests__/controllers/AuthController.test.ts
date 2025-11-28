import { Request, Response, NextFunction } from 'express';
import { AuthController } from '../../controllers/AuthController';
import { authService } from '../../services/AuthService';
import { AuthenticatedRequest } from '../../middleware/auth';

// Mock the AuthService
jest.mock('../../services/AuthService', () => ({
    authService: {
        register: jest.fn(),
        login: jest.fn(),
        updateProfile: jest.fn(),
        changePassword: jest.fn(),
    },
}));

describe('AuthController', () => {
    let authController: AuthController;
    let mockRequest: Partial<Request | AuthenticatedRequest>;
    let mockResponse: Partial<Response>;
    let mockNext: NextFunction;

    beforeEach(() => {
        authController = new AuthController();

        mockRequest = {
            body: {},
        };

        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };

        mockNext = jest.fn();

        jest.clearAllMocks();
    });

    describe('register', () => {
        it('should successfully register a new user', async () => {
            const mockResult = {
                user: {
                    id: 'user-123',
                    email: 'test@example.com',
                    fullName: 'Test User',
                },
                token: 'mock-token',
                refreshToken: 'mock-refresh-token',
            };

            mockRequest.body = {
                email: 'test@example.com',
                password: 'Password123',
                fullName: 'Test User',
            };

            (authService.register as jest.Mock).mockResolvedValue(mockResult);

            await authController.register(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            expect(mockResponse.status).toHaveBeenCalledWith(201);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Registration successful',
                ...mockResult,
            });
        });

        it('should return 400 if email is missing', async () => {
            mockRequest.body = {
                password: 'Password123',
            };

            await authController.register(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Validation error',
                message: 'Email and password are required',
            });
        });

        it('should return 400 if password is missing', async () => {
            mockRequest.body = {
                email: 'test@example.com',
            };

            await authController.register(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Validation error',
                message: 'Email and password are required',
            });
        });

        it('should return 409 if email already registered', async () => {
            mockRequest.body = {
                email: 'test@example.com',
                password: 'Password123',
            };

            (authService.register as jest.Mock).mockRejectedValue(
                new Error('Email already registered')
            );

            await authController.register(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            expect(mockResponse.status).toHaveBeenCalledWith(409);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Conflict',
                message: 'Email already registered',
            });
        });

        it('should return 400 for invalid email format', async () => {
            mockRequest.body = {
                email: 'invalid-email',
                password: 'Password123',
            };

            (authService.register as jest.Mock).mockRejectedValue(
                new Error('Invalid email format')
            );

            await authController.register(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Validation error',
                message: 'Invalid email format',
            });
        });

        it('should return 400 for weak password', async () => {
            mockRequest.body = {
                email: 'test@example.com',
                password: 'weak',
            };

            (authService.register as jest.Mock).mockRejectedValue(
                new Error('Password must be at least 8 characters')
            );

            await authController.register(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Validation error',
                message: 'Password must be at least 8 characters',
            });
        });

        it('should call next for unexpected errors', async () => {
            mockRequest.body = {
                email: 'test@example.com',
                password: 'Password123',
            };

            const unexpectedError = new Error('Database error');
            (authService.register as jest.Mock).mockRejectedValue(unexpectedError);

            await authController.register(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            expect(mockNext).toHaveBeenCalledWith(unexpectedError);
        });
    });

    describe('login', () => {
        it('should successfully login user', async () => {
            const mockResult = {
                user: {
                    id: 'user-123',
                    email: 'test@example.com',
                },
                token: 'mock-token',
                refreshToken: 'mock-refresh-token',
            };

            mockRequest.body = {
                email: 'test@example.com',
                password: 'Password123',
            };

            (authService.login as jest.Mock).mockResolvedValue(mockResult);

            await authController.login(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Login successful',
                ...mockResult,
            });
        });

        it('should return 400 if credentials missing', async () => {
            mockRequest.body = {};

            await authController.login(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Validation error',
                message: 'Email and password are required',
            });
        });

        it('should return 401 for invalid credentials', async () => {
            mockRequest.body = {
                email: 'test@example.com',
                password: 'WrongPassword',
            };

            (authService.login as jest.Mock).mockRejectedValue(
                new Error('Invalid email or password')
            );

            await authController.login(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Unauthorized',
                message: 'Invalid email or password',
            });
        });

        it('should return 403 for inactive account', async () => {
            mockRequest.body = {
                email: 'test@example.com',
                password: 'Password123',
            };

            (authService.login as jest.Mock).mockRejectedValue(
                new Error('Account is not active')
            );

            await authController.login(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            expect(mockResponse.status).toHaveBeenCalledWith(403);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Forbidden',
                message: 'Account is not active',
            });
        });
    });

    describe('me', () => {
        it('should return current user profile', async () => {
            const mockUser = {
                id: 'user-123',
                email: 'test@example.com',
                toJSON: jest.fn().mockReturnValue({
                    id: 'user-123',
                    email: 'test@example.com',
                }),
            };

            (mockRequest as AuthenticatedRequest).user = mockUser as any;

            await authController.me(
                mockRequest as AuthenticatedRequest,
                mockResponse as Response,
                mockNext
            );

            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                user: {
                    id: 'user-123',
                    email: 'test@example.com',
                },
            });
        });

        it('should return 401 if user not authenticated', async () => {
            (mockRequest as AuthenticatedRequest).user = undefined;

            await authController.me(
                mockRequest as AuthenticatedRequest,
                mockResponse as Response,
                mockNext
            );

            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Unauthorized',
                message: 'Not authenticated',
            });
        });
    });

    describe('updateProfile', () => {
        it('should successfully update user profile', async () => {
            const mockUser = {
                id: 'user-123',
                fullName: 'Updated Name',
                toJSON: jest.fn().mockReturnValue({
                    id: 'user-123',
                    fullName: 'Updated Name',
                }),
            };

            (mockRequest as AuthenticatedRequest).userId = 'user-123';
            mockRequest.body = {
                fullName: 'Updated Name',
            };

            (authService.updateProfile as jest.Mock).mockResolvedValue(mockUser);

            await authController.updateProfile(
                mockRequest as AuthenticatedRequest,
                mockResponse as Response,
                mockNext
            );

            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Profile updated successfully',
                user: mockUser.toJSON(),
            });
        });

        it('should return 401 if user not authenticated', async () => {
            (mockRequest as AuthenticatedRequest).userId = undefined;

            await authController.updateProfile(
                mockRequest as AuthenticatedRequest,
                mockResponse as Response,
                mockNext
            );

            expect(mockResponse.status).toHaveBeenCalledWith(401);
        });
    });

    describe('changePassword', () => {
        it('should successfully change password', async () => {
            (mockRequest as AuthenticatedRequest).userId = 'user-123';
            mockRequest.body = {
                currentPassword: 'OldPassword123',
                newPassword: 'NewPassword456',
            };

            (authService.changePassword as jest.Mock).mockResolvedValue(undefined);

            await authController.changePassword(
                mockRequest as AuthenticatedRequest,
                mockResponse as Response,
                mockNext
            );

            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Password changed successfully',
            });
        });

        it('should return 401 if user not authenticated', async () => {
            (mockRequest as AuthenticatedRequest).userId = undefined;

            await authController.changePassword(
                mockRequest as AuthenticatedRequest,
                mockResponse as Response,
                mockNext
            );

            expect(mockResponse.status).toHaveBeenCalledWith(401);
        });

        it('should return 400 if current password missing', async () => {
            (mockRequest as AuthenticatedRequest).userId = 'user-123';
            mockRequest.body = {
                newPassword: 'NewPassword456',
            };

            await authController.changePassword(
                mockRequest as AuthenticatedRequest,
                mockResponse as Response,
                mockNext
            );

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Validation error',
                message: 'Current password and new password are required',
            });
        });

        it('should return 400 if current password incorrect', async () => {
            (mockRequest as AuthenticatedRequest).userId = 'user-123';
            mockRequest.body = {
                currentPassword: 'WrongPassword',
                newPassword: 'NewPassword456',
            };

            (authService.changePassword as jest.Mock).mockRejectedValue(
                new Error('Current password is incorrect')
            );

            await authController.changePassword(
                mockRequest as AuthenticatedRequest,
                mockResponse as Response,
                mockNext
            );

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Validation error',
                message: 'Current password is incorrect',
            });
        });
    });
});
