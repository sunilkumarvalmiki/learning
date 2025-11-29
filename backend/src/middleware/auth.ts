import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config';
import { AppDataSource } from '../config/database';
import { User, UserRole } from '../models/User';

export interface JwtPayload {
    userId: string;
    email: string;
    role: string;
}

export interface AuthenticatedRequest extends Request {
    user?: User;
    userId?: string;
}

/**
 * Verify JWT token and attach user to request
 */
export const authenticate = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'No token provided'
            });
            return;
        }

        const token = authHeader.substring(7);

        const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;

        const userRepository = AppDataSource.getRepository(User);
        const user = await userRepository.findOne({
            where: { id: decoded.userId }
        });

        if (!user) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'User not found'
            });
            return;
        }

        // Check if user is soft-deleted
        if (user.deletedAt) {
            res.status(403).json({
                error: 'Forbidden',
                message: 'Account is not active'
            });
            return;
        }

        req.user = user;
        req.userId = user.id;
        next();
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'Invalid token'
            });
            return;
        }
        if (error instanceof jwt.TokenExpiredError) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'Token expired'
            });
            return;
        }
        next(error);
    }
};

/**
 * Optional authentication - allows both authenticated and unauthenticated requests
 * For backwards compatibility during migration
 */
export const optionalAuth = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            // No token - continue without authentication
            // Use userId from query/body for backwards compatibility
            req.userId = (req.query.userId as string) || (req.body?.userId as string);
            next();
            return;
        }

        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;

        const userRepository = AppDataSource.getRepository(User);
        const user = await userRepository.findOne({
            where: { id: decoded.userId }
        });

        if (user && !user.deletedAt) {
            req.user = user;
            req.userId = user.id;
        } else {
            // Fall back to userId from query/body
            req.userId = (req.query.userId as string) || (req.body?.userId as string);
        }

        next();
    } catch {
        // Token invalid - continue without authentication
        req.userId = (req.query.userId as string) || (req.body?.userId as string);
        next();
    }
};

/**
 * Require admin role (team_admin or enterprise)
 */
export const requireAdmin = (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): void => {
    const adminRoles = [UserRole.TEAM_ADMIN, UserRole.ENTERPRISE];
    if (!req.user || !adminRoles.includes(req.user.role)) {
        res.status(403).json({
            error: 'Forbidden',
            message: 'Admin access required'
        });
        return;
    }
    next();
};

/**
 * Generate JWT token for user
 */
export const generateToken = (user: User): string => {
    const payload: JwtPayload = {
        userId: user.id,
        email: user.email,
        role: user.role
    };

    return jwt.sign(payload, config.jwt.secret, {
        expiresIn: config.jwt.expiresIn as string
    } as jwt.SignOptions);
};

/**
 * Generate refresh token (longer expiry)
 */
export const generateRefreshToken = (user: User): string => {
    return jwt.sign(
        { userId: user.id, email: user.email, type: 'refresh' },
        config.jwt.secret, // Corrected to use config.jwt.secret
        { expiresIn: '7d' }
    );
};

export const verifyRefreshToken = (token: string): any => {
    try {
        const decoded = jwt.verify(token, config.jwt.secret) as any; // Corrected to use config.jwt.secret
        if (decoded.type !== 'refresh') {
            throw new Error('Invalid token type');
        }
        return decoded;
    } catch (error) {
        throw new Error('Invalid refresh token');
    }
};

