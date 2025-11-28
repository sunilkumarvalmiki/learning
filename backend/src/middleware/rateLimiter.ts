import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

/**
 * Rate limiting middleware configuration
 * Protects against brute force attacks and DoS
 */

/**
 * Standard rate limit for general API endpoints
 * 100 requests per 15 minutes per IP
 */
export const standardLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
    legacyHeaders: false, // Disable `X-RateLimit-*` headers
    message: {
        error: 'Too Many Requests',
        message: 'Too many requests from this IP, please try again later.',
    },
    handler: (_req: Request, res: Response) => {
        res.status(429).json({
            error: 'Too Many Requests',
            message: 'You have exceeded the rate limit. Please try again later.',
            retryAfter: res.getHeader('RateLimit-Reset'),
        });
    },
});

/**
 * Strict rate limit for authentication endpoints
 * 5 attempts per 15 minutes per IP to prevent brute force
 */
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 requests per windowMs
    skipSuccessfulRequests: false,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        error: 'Too Many Login Attempts',
        message: 'Too many login attempts from this IP, please try again after 15 minutes.',
    },
    handler: (_req: Request, res: Response) => {
        res.status(429).json({
            error: 'Too Many Login Attempts',
            message: 'Account temporarily locked due to too many failed attempts. Please try again in 15 minutes.',
            retryAfter: res.getHeader('RateLimit-Reset'),
        });
    },
});

/**
 * Moderate rate limit for search endpoints
 * 30 requests per minute per IP
 */
export const searchLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 30, // Limit each IP to 30 requests per minute
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        error: 'Too Many Search Requests',
        message: 'Too many search requests, please slow down.',
    },
});

/**
 * File upload rate limit
 * 10 uploads per hour per IP
 */
export const uploadLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // Limit each IP to 10 uploads per hour
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        error: 'Upload Limit Exceeded',
        message: 'Too many file uploads. Please try again later.',
    },
});

/**
 * API documentation rate limit (more permissive)
 * 200 requests per 15 minutes
 */
export const apiDocsLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * Create a custom rate limiter with specific options
 */
export const createRateLimiter = (options: {
    windowMs: number;
    max: number;
    message?: string;
}) => {
    return rateLimit({
        windowMs: options.windowMs,
        max: options.max,
        standardHeaders: true,
        legacyHeaders: false,
        message: {
            error: 'Rate Limit Exceeded',
            message: options.message || 'Too many requests, please try again later.',
        },
    });
};
