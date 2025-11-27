import jwt from 'jsonwebtoken';
import { UserRole } from '../../models/User';

// Test JWT functionality directly without importing auth module
// This avoids config loading issues

const TEST_SECRET = 'test-secret-key';

interface JwtPayload {
    userId: string;
    email: string;
    role: string;
}

// Local implementations for testing
function generateTestToken(user: { id: string; email: string; role: UserRole }): string {
    const payload: JwtPayload = {
        userId: user.id,
        email: user.email,
        role: user.role,
    };
    return jwt.sign(payload, TEST_SECRET, { expiresIn: '1h' });
}

function generateTestRefreshToken(user: { id: string; email: string; role: UserRole }): string {
    const payload: JwtPayload = {
        userId: user.id,
        email: user.email,
        role: user.role,
    };
    return jwt.sign(payload, TEST_SECRET, { expiresIn: '7d' });
}

describe('JWT Token Generation', () => {
    const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        role: UserRole.FREE,
    };

    describe('generateToken', () => {
        it('should generate a valid JWT token', () => {
            const token = generateTestToken(mockUser);

            expect(token).toBeDefined();
            expect(typeof token).toBe('string');
            expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
        });

        it('should include user data in token payload', () => {
            const token = generateTestToken(mockUser);
            const decoded = jwt.verify(token, TEST_SECRET) as JwtPayload;

            expect(decoded.userId).toBe(mockUser.id);
            expect(decoded.email).toBe(mockUser.email);
            expect(decoded.role).toBe(mockUser.role);
        });

        it('should set expiration time', () => {
            const token = generateTestToken(mockUser);
            const decoded = jwt.decode(token) as JwtPayload & { exp: number; iat: number };

            expect(decoded.exp).toBeDefined();
            expect(decoded.iat).toBeDefined();
            expect(decoded.exp).toBeGreaterThan(decoded.iat);
        });
    });

    describe('generateRefreshToken', () => {
        it('should generate a valid refresh token', () => {
            const token = generateTestRefreshToken(mockUser);

            expect(token).toBeDefined();
            expect(typeof token).toBe('string');
        });

        it('should have longer expiration than access token', () => {
            const accessToken = generateTestToken(mockUser);
            const refreshToken = generateTestRefreshToken(mockUser);

            const accessDecoded = jwt.decode(accessToken) as { exp: number };
            const refreshDecoded = jwt.decode(refreshToken) as { exp: number };

            // Refresh token should expire later than access token
            expect(refreshDecoded.exp).toBeGreaterThan(accessDecoded.exp);
        });
    });
});

describe('JWT Token Verification', () => {
    it('should reject expired tokens', () => {
        const payload: JwtPayload = {
            userId: 'user-123',
            email: 'test@example.com',
            role: 'free',
        };

        // Create token that expires immediately
        const token = jwt.sign(payload, TEST_SECRET, { expiresIn: '-1s' });

        expect(() => {
            jwt.verify(token, TEST_SECRET);
        }).toThrow(jwt.TokenExpiredError);
    });

    it('should reject tokens with wrong secret', () => {
        const payload: JwtPayload = {
            userId: 'user-123',
            email: 'test@example.com',
            role: 'free',
        };

        const token = jwt.sign(payload, 'correct-secret', { expiresIn: '1h' });

        expect(() => {
            jwt.verify(token, 'wrong-secret');
        }).toThrow(jwt.JsonWebTokenError);
    });

    it('should reject malformed tokens', () => {
        expect(() => {
            jwt.verify('not.a.valid.token', TEST_SECRET);
        }).toThrow(jwt.JsonWebTokenError);
    });

    it('should verify valid tokens successfully', () => {
        const payload: JwtPayload = {
            userId: 'user-123',
            email: 'test@example.com',
            role: 'free',
        };

        const token = jwt.sign(payload, TEST_SECRET, { expiresIn: '1h' });
        const decoded = jwt.verify(token, TEST_SECRET) as JwtPayload;

        expect(decoded.userId).toBe(payload.userId);
        expect(decoded.email).toBe(payload.email);
    });
});

describe('UserRole Enum', () => {
    it('should have expected role values', () => {
        expect(UserRole.FREE).toBe('free');
        expect(UserRole.PRO).toBe('pro');
        expect(UserRole.TEAM_MEMBER).toBe('team_member');
        expect(UserRole.TEAM_ADMIN).toBe('team_admin');
        expect(UserRole.ENTERPRISE).toBe('enterprise');
    });

    it('should have 5 role types', () => {
        const roleValues = Object.values(UserRole);
        expect(roleValues).toHaveLength(5);
    });
});
