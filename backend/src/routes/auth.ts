import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { authLimiter } from '../middleware/rateLimiter';
import {
    registerSchema,
    loginSchema,
    updateProfileSchema,
    changePasswordSchema,
} from '../validation/schemas';

const router = Router();
const authController = new AuthController();

/**
 * POST /api/v1/auth/register
 * Register a new user
 */
router.post(
    '/register',
    authLimiter,
    validate(registerSchema),
    authController.register.bind(authController)
);

/**
 * POST /api/v1/auth/login
 * Login user
 */
router.post(
    '/login',
    authLimiter,
    validate(loginSchema),
    authController.login.bind(authController)
);

/**
 * GET /api/v1/auth/me
 * Get current user profile (requires authentication)
 */
router.get('/me', authenticate, authController.me.bind(authController));

/**
 * PATCH /api/v1/auth/profile
 * Update user profile (requires authentication)
 */
router.patch(
    '/profile',
    authenticate,
    validate(updateProfileSchema),
    authController.updateProfile.bind(authController)
);

/**
 * POST /api/v1/auth/change-password
 * Change user password (requires authentication)
 */
router.post(
    '/change-password',
    authLimiter,
    authenticate,
    validate(changePasswordSchema),
    authController.changePassword.bind(authController)
);

export default router;
