import { AppDataSource } from '../config/database';
import { User, UserRole } from '../models/User';
import { generateToken, generateRefreshToken } from '../middleware/auth';

export interface RegisterInput {
    email: string;
    password: string;
    fullName?: string;
}

export interface LoginInput {
    email: string;
    password: string;
}

export interface AuthResponse {
    user: Omit<User, 'passwordHash' | 'hashPassword' | 'comparePassword' | 'toJSON'>;
    token: string;
    refreshToken: string;
}

export class AuthService {
    private userRepository = AppDataSource.getRepository(User);

    /**
     * Register a new user
     */
    async register(input: RegisterInput): Promise<AuthResponse> {
        const existingUser = await this.userRepository.findOne({
            where: { email: input.email.toLowerCase() }
        });

        if (existingUser) {
            throw new Error('Email already registered');
        }

        if (!this.isValidEmail(input.email)) {
            throw new Error('Invalid email format');
        }

        if (!this.isValidPassword(input.password)) {
            throw new Error('Password must be at least 8 characters with uppercase, lowercase, and number');
        }

        const user = this.userRepository.create({
            email: input.email.toLowerCase(),
            passwordHash: input.password, // Will be hashed by @BeforeInsert
            fullName: input.fullName,
            role: UserRole.FREE,
            emailVerified: false
        });

        await this.userRepository.save(user);

        const token = generateToken(user);
        const refreshToken = generateRefreshToken(user);

        return {
            user: user.toJSON(),
            token,
            refreshToken
        };
    }

    /**
     * Login user
     */
    async login(input: LoginInput): Promise<AuthResponse> {
        const user = await this.userRepository
            .createQueryBuilder('user')
            .addSelect('user.passwordHash')
            .where('user.email = :email', { email: input.email.toLowerCase() })
            .andWhere('user.deletedAt IS NULL')
            .getOne();

        if (!user) {
            throw new Error('Invalid email or password');
        }

        const isValidPassword = await user.comparePassword(input.password);
        if (!isValidPassword) {
            throw new Error('Invalid email or password');
        }

        // Update last login
        user.lastLoginAt = new Date();
        await this.userRepository.save(user);

        const token = generateToken(user);
        const refreshToken = generateRefreshToken(user);

        return {
            user: user.toJSON(),
            token,
            refreshToken
        };
    }

    /**
     * Get user by ID
     */
    async getUserById(userId: string): Promise<User | null> {
        return this.userRepository.findOne({
            where: { id: userId }
        });
    }

    /**
     * Update user profile
     */
    async updateProfile(
        userId: string,
        updates: { fullName?: string }
    ): Promise<User> {
        const user = await this.userRepository.findOne({
            where: { id: userId }
        });

        if (!user) {
            throw new Error('User not found');
        }

        if (updates.fullName !== undefined) {
            user.fullName = updates.fullName;
        }

        await this.userRepository.save(user);
        return user;
    }

    /**
     * Change password
     */
    async changePassword(
        userId: string,
        currentPassword: string,
        newPassword: string
    ): Promise<void> {
        const user = await this.userRepository
            .createQueryBuilder('user')
            .addSelect('user.passwordHash')
            .where('user.id = :id', { id: userId })
            .getOne();

        if (!user) {
            throw new Error('User not found');
        }

        const isValidPassword = await user.comparePassword(currentPassword);
        if (!isValidPassword) {
            throw new Error('Current password is incorrect');
        }

        if (!this.isValidPassword(newPassword)) {
            throw new Error('New password must be at least 8 characters with uppercase, lowercase, and number');
        }

        user.passwordHash = newPassword; // Will be hashed by @BeforeUpdate
        await this.userRepository.save(user);
    }

    /**
     * Validate email format
     */
    private isValidEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Validate password strength
     */
    private isValidPassword(password: string): boolean {
        // At least 8 characters, one uppercase, one lowercase, one number
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
        return passwordRegex.test(password);
    }
}

export const authService = new AuthService();
