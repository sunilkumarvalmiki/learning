import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/AuthService';
import { AuthenticatedRequest } from '../middleware/auth';

export class AuthController {
    /**
     * POST /api/v1/auth/register
     * Register a new user
     */
    async register(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { email, password, fullName } = req.body;

            if (!email || !password) {
                res.status(400).json({
                    error: 'Validation error',
                    message: 'Email and password are required'
                });
                return;
            }

            const result = await authService.register({
                email,
                password,
                fullName
            });

            res.status(201).json({
                message: 'Registration successful',
                ...result
            });
        } catch (error) {
            if (error instanceof Error) {
                if (error.message === 'Email already registered') {
                    res.status(409).json({
                        error: 'Conflict',
                        message: error.message
                    });
                    return;
                }
                if (error.message.includes('Invalid') || error.message.includes('must be')) {
                    res.status(400).json({
                        error: 'Validation error',
                        message: error.message
                    });
                    return;
                }
            }
            next(error);
        }
    }

    /**
     * POST /api/v1/auth/login
     * Login user
     */
    async login(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                res.status(400).json({
                    error: 'Validation error',
                    message: 'Email and password are required'
                });
                return;
            }

            const result = await authService.login({ email, password });

            res.status(200).json({
                message: 'Login successful',
                ...result
            });
        } catch (error) {
            if (error instanceof Error) {
                if (error.message === 'Invalid email or password') {
                    res.status(401).json({
                        error: 'Unauthorized',
                        message: error.message
                    });
                    return;
                }
                if (error.message === 'Account is not active') {
                    res.status(403).json({
                        error: 'Forbidden',
                        message: error.message
                    });
                    return;
                }
            }
            next(error);
        }
    }

    /**
     * GET /api/v1/auth/me
     * Get current user profile
     */
    async me(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.user) {
                res.status(401).json({
                    error: 'Unauthorized',
                    message: 'Not authenticated'
                });
                return;
            }

            res.status(200).json({
                user: req.user.toJSON()
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * PATCH /api/v1/auth/profile
     * Update user profile
     */
    async updateProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.userId) {
                res.status(401).json({
                    error: 'Unauthorized',
                    message: 'Not authenticated'
                });
                return;
            }

            const { fullName } = req.body;

            const user = await authService.updateProfile(req.userId, {
                fullName
            });

            res.status(200).json({
                message: 'Profile updated successfully',
                user: user.toJSON()
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/v1/auth/change-password
     * Change user password
     */
    async changePassword(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.userId) {
                res.status(401).json({
                    error: 'Unauthorized',
                    message: 'Not authenticated'
                });
                return;
            }

            const { currentPassword, newPassword } = req.body;

            if (!currentPassword || !newPassword) {
                res.status(400).json({
                    error: 'Validation error',
                    message: 'Current password and new password are required'
                });
                return;
            }

            await authService.changePassword(req.userId, currentPassword, newPassword);

            res.status(200).json({
                message: 'Password changed successfully'
            });
        } catch (error) {
            if (error instanceof Error) {
                if (error.message === 'Current password is incorrect') {
                    res.status(400).json({
                        error: 'Validation error',
                        message: error.message
                    });
                    return;
                }
                if (error.message.includes('must be')) {
                    res.status(400).json({
                        error: 'Validation error',
                        message: error.message
                    });
                    return;
                }
            }
            next(error);
        }
    }
}
