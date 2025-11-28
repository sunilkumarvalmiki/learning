import helmet from 'helmet';
            },

// X-Frame-Options: Prevent clickjacking
frameguard: {
    action: 'deny',
            },

// X-Content-Type-Options: Prevent MIME sniffing
noSniff: true,

    // X-DNS-Prefetch-Control: Control DNS prefetching
    dnsPrefetchControl: {
    allow: false,
            },

// X-Download-Options: Prevent IE from executing downloads
ieNoOpen: true,

    // Referrer-Policy: Control referrer information
    referrerPolicy: {
    policy: 'strict-origin-when-cross-origin',
            },

// Permissions-Policy (formerly Feature-Policy)
permittedCrossDomainPolicies: {
    permittedPolicies: 'none',
            },

// X-Powered-By: Remove
hidePoweredBy: true,

    // Expect-CT: Certificate Transparency
    expectCt: {
    enforce: true,
        maxAge: 86400, // 24 hours
            },

// Cross-Origin-Embedder-Policy
crossOriginEmbedderPolicy: false, // May break some integrations, enable with caution

    // Cross-Origin-Opener-Policy
    crossOriginOpenerPolicy: { policy: 'same-origin' },

// Cross-Origin-Resource-Policy
crossOriginResourcePolicy: { policy: 'same-origin' },

// Origin-Agent-Cluster
originAgentCluster: true,
        })
    );

// Additional custom security headers
app.use((_req, res, next) => {
    // Permissions-Policy
    res.setHeader(
        'Permissions-Policy',
        [
            'geolocation=()',
            'microphone=()',
            'camera=()',
            'payment=()',
            'usb=()',
            'magnetometer=()',
            'gyroscope=()',
            'accelerometer=()',
        ].join(', ')
    );

    // X-XSS-Protection (legacy, but some browsers still use it)
    res.setHeader('X-XSS-Protection', '1; mode=block');

    // Remove Server header
    res.removeHeader('X-Powered-By');
    res.removeHeader('Server');

    next();
});
};

/**
 * CORS configuration for production
 * Should be configured with specific allowed origins
 */
export const corsOptions = {
    origin: function (origin: string | undefined, callback: Function) {
        // Allow requests with no origin (mobile apps, Postman, etc.)
        if (!origin) return callback(null, true);

        const allowedOrigins = process.env.ALLOWED_ORIGINS
            ? process.env.ALLOWED_ORIGINS.split(',')
            : [
                'http://localhost:3000',
                'http://localhost:5173',
                'http://localhost:5174',
            ];

        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['RateLimit-Limit', 'RateLimit-Remaining', 'RateLimit-Reset'],
    maxAge: 86400, // 24 hours
};

/**
 * Development CORS configuration (more permissive)
 */
export const devCorsOptions = {
    origin: true,
    credentials: true,
    optionsSuccessStatus: 200,
};
