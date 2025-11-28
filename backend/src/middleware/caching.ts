import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

/**
 * HTTP caching middleware
 */

/**
 * Set cache headers for static assets
 */
export const cacheStaticAssets = (req: Request, res: Response, next: NextFunction) => {
    // Cache static assets for 1 year (immutable)
    const staticPaths = ['/static/', '/assets/', '/images/', '/fonts/'];
    const isStatic = staticPaths.some((path) => req.path.startsWith(path));

    if (isStatic) {
        res.set({
            'Cache-Control': 'public, max-age=31536000, immutable',
            'Expires': new Date(Date.now() + 31536000000).toUTCString(),
        });
    }

    next();
};

/**
 * Set cache headers for API responses
 */
export const cacheAPIResponses = (duration: number = 300) => {
    return (req: Request, res: Response, next: NextFunction) => {
        // Only cache GET requests
        if (req.method !== 'GET') {
            return next();
        }

        // Set cache headers
        res.set({
            'Cache-Control': `public, max-age=${duration}`,
            'Vary': 'Accept-Encoding, Authorization',
        });

        next();
    };
};

/**
 * Disable caching for sensitive routes
 */
export const noCache = (req: Request, res: Response, next: NextFunction) => {
    res.set({
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store',
    });

    next();
};

/**
 * ETag generation and validation middleware
 */
export const etag = (req: Request, res: Response, next: NextFunction) => {
    // Only for GET and HEAD requests
    if (req.method !== 'GET' && req.method !== 'HEAD') {
        return next();
    }

    const originalSend = res.send;

    res.send = function (body: any): Response {
        // Generate ETag from response body
        let etagValue: string | undefined;

        if (body) {
            const bodyString = typeof body === 'string' ? body : JSON.stringify(body);
            etagValue = `"${crypto.createHash('md5').update(bodyString).digest('hex')}"`;

            // Set ETag header
            res.set('ETag', etagValue);

            // Check if client has matching ETag
            const clientETag = req.get('If-None-Match');
            if (clientETag === etagValue) {
                res.status(304);
                return originalSend.call(this, '');
            }
        }

        return originalSend.call(this, body);
    };

    next();
};

/**
 * Conditional caching based on user authentication
 */
export const conditionalCache = (
    authenticatedDuration: number = 60,
    publicDuration: number = 300
) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (req.method !== 'GET') {
            return next();
        }

        // Check if request is authenticated (assumes auth middleware sets req.user)
        const isAuthenticated = !!(req as any).user;

        if (isAuthenticated) {
            // Shorter cache for authenticated users
            res.set({
                'Cache-Control': `private, max-age=${authenticatedDuration}`,
                'Vary': 'Authorization',
            });
        } else {
            // Longer cache for public content
            res.set({
                'Cache-Control': `public, max-age=${publicDuration}`,
                'Vary': 'Accept-Encoding',
            });
        }

        next();
    };
};

/**
 * Stale-while-revalidate caching
 * Allows serving stale content while fetching fresh data
 */
export const staleWhileRevalidate = (maxAge: number = 300, staleTime: number = 3600) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (req.method !== 'GET') {
            return next();
        }

        res.set({
            'Cache-Control': `public, max-age=${maxAge}, stale-while-revalidate=${staleTime}`,
            'Vary': 'Accept-Encoding',
        });

        next();
    };
};

/**
 * Cache middleware for search results
 * Shorter TTL due to dynamic nature
 */
export const cacheSearchResults = cacheAPIResponses(300); // 5 minutes

/**
 * Cache middleware for document listings
 */
export const cacheDocumentListing = cacheAPIResponses(60); // 1 minute

/**
 * Cache middleware for user profile
 */
export const cacheUserProfile = (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== 'GET') {
        return next();
    }

    res.set({
        'Cache-Control': 'private, max-age=300', // 5 minutes
        'Vary': 'Authorization',
    });

    next();
};
