import { AuthService, RegisterInput, LoginInput } from '../../services/AuthService';
import { User, UserRole } from '../../models/User';
import { AppDataSource } from '../../config/database';
import * as authMiddleware from '../../middleware/auth';

// Mock the database and auth middleware
jest.mock('../../config/database', () => ({
    AppDataSource: {
        getRepository: jest.fn(),
    },
}));

jest.mock('../../middleware/auth', () => ({
    generateToken: jest.fn(),
    generateRefreshToken: jest.fn(),
}));

describe('AuthService', () => {
    let authService: AuthService;
    let mockUserRepository: any;
    let mockQueryBuilder: any;

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();

        // Mock query builder
        mockQueryBuilder = {
            addSelect: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            getOne: jest.fn(),
        };

        // Mock user repository
        mockUserRepository = {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            createQueryBuilder: jest.fn(() => mockQueryBuilder),
        };

        (AppDataSource.getRepository as jest.Mock).mockReturnValue(mockUserRepository);

        // Mock auth middleware
        (authMiddleware.generateToken as jest.Mock).mockReturnValue('mock-token');
        (authMiddleware.generateRefreshToken as jest.Mock).mockReturnValue('mock-refresh-token');

        authService = new AuthService();
    });

    describe('register', () => {
        const validInput: RegisterInput = {
            email: 'test@example.com',
            password: 'Password123',
            fullName: 'Test User',
        };

        it('should successfully register a new user', async () => {
            mockUserRepository.findOne.mockResolvedValue(null);

            const mockUser = {
                id: 'user-123',
                email: validInput.email.toLowerCase(),
                role: UserRole.FREE,
                fullName: validInput.fullName,
                toJSON: jest.fn().mockReturnValue({
                    id: 'user-123',
                    email: validInput.email.toLowerCase(),
                    role: UserRole.FREE,
                    fullName: validInput.fullName,
                }),
            };

            mockUserRepository.create.mockReturnValue(mockUser);
            mockUserRepository.save.mockResolvedValue(mockUser);

            const result = await authService.register(validInput);

            expect(result).toEqual({
                user: expect.objectContaining({
                    id: 'user-123',
                    email: validInput.email.toLowerCase(),
                }),
                token: 'mock-token',
                refreshToken: 'mock-refresh-token',
            });

            expect(mockUserRepository.findOne).toHaveBeenCalledWith({
                where: { email: validInput.email.toLowerCase() },
            });
            expect(mockUserRepository.create).toHaveBeenCalledWith({
                email: validInput.email.toLowerCase(),
                passwordHash: validInput.password,
                fullName: validInput.fullName,
                role: UserRole.FREE,
                emailVerified: false,
            });
            expect(mockUserRepository.save).toHaveBeenCalledWith(mockUser);
        });

        it('should throw error if email already exists', async () => {
            mockUserRepository.findOne.mockResolvedValue({ id: 'existing-user' });

            await expect(authService.register(validInput)).rejects.toThrow('Email already registered');
        });

        it('should throw error for invalid email format', async () => {
            mockUserRepository.findOne.mockResolvedValue(null);

            const invalidInput = { ...validInput, email: 'invalid-email' };

            await expect(authService.register(invalidInput)).rejects.toThrow('Invalid email format');
        });

        it('should throw error for weak password', async () => {
            mockUserRepository.findOne.mockResolvedValue(null);

            const weakPasswords = [
                'short', // too short
                'alllowercase123', // no uppercase
                'ALLUPPERCASE123', // no lowercase
                'NoNumbers', // no numbers
                'Pass123', // too short
            ];

            for (const password of weakPasswords) {
                const invalidInput = { ...validInput, password };
                await expect(authService.register(invalidInput)).rejects.toThrow(
                    'Password must be at least 8 characters with uppercase, lowercase, and number'
                );
            }
        });

        it('should convert email to lowercase', async () => {
            mockUserRepository.findOne.mockResolvedValue(null);

            const mockUser = {
                id: 'user-123',
                email: 'test@example.com',
                toJSON: jest.fn().mockReturnValue({ id: 'user-123' }),
            };

            mockUserRepository.create.mockReturnValue(mockUser);
            mockUserRepository.save.mockResolvedValue(mockUser);

            const inputWithUppercase = { ...validInput, email: 'TEST@EXAMPLE.COM' };
            await authService.register(inputWithUppercase);

            expect(mockUserRepository.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    email: 'test@example.com',
                })
            );
        });

        it('should set default role to FREE', async () => {
            mockUserRepository.findOne.mockResolvedValue(null);

            const mockUser = {
                id: 'user-123',
                toJSON: jest.fn().mockReturnValue({ id: 'user-123', role: UserRole.FREE }),
            };

            mockUserRepository.create.mockReturnValue(mockUser);
            mockUserRepository.save.mockResolvedValue(mockUser);

            await authService.register(validInput);

            expect(mockUserRepository.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    role: UserRole.FREE,
                })
            );
        });
    });

    describe('login', () => {
        const validInput: LoginInput = {
            email: 'test@example.com',
            password: 'Password123',
        };

        it('should successfully login with valid credentials', async () => {
            const mockUser = {
                id: 'user-123',
                email: validInput.email,
                comparePassword: jest.fn().mockResolvedValue(true),
                lastLoginAt: null,
                toJSON: jest.fn().mockReturnValue({
                    id: 'user-123',
                    email: validInput.email,
                }),
            };

            mockQueryBuilder.getOne.mockResolvedValue(mockUser);
            mockUserRepository.save.mockResolvedValue(mockUser);

            const result = await authService.login(validInput);

            expect(result).toEqual({
                user: expect.objectContaining({
                    id: 'user-123',
                    email: validInput.email,
                }),
                token: 'mock-token',
                refreshToken: 'mock-refresh-token',
            });

            expect(mockUser.comparePassword).toHaveBeenCalledWith(validInput.password);
            expect(mockUser.lastLoginAt).toBeDefined();
            expect(mockUserRepository.save).toHaveBeenCalledWith(mockUser);
        });

        it('should throw error if user not found', async () => {
            mockQueryBuilder.getOne.mockResolvedValue(null);

            await expect(authService.login(validInput)).rejects.toThrow('Invalid email or password');
        });

        it('should throw error if password is incorrect', async () => {
            const mockUser = {
                comparePassword: jest.fn().mockResolvedValue(false),
            };

            mockQueryBuilder.getOne.mockResolvedValue(mockUser);

            await expect(authService.login(validInput)).rejects.toThrow('Invalid email or password');
        });

        it('should update lastLoginAt on successful login', async () => {
            const mockUser = {
                id: 'user-123',
                comparePassword: jest.fn().mockResolvedValue(true),
                lastLoginAt: null,
                toJSON: jest.fn().mockReturnValue({ id: 'user-123' }),
            };

            mockQueryBuilder.getOne.mockResolvedValue(mockUser);
            mockUserRepository.save.mockResolvedValue(mockUser);

            await authService.login(validInput);

            expect(mockUser.lastLoginAt).toBeInstanceOf(Date);
        });

        it('should query with lowercase email', async () => {
            mockQueryBuilder.getOne.mockResolvedValue(null);

            const inputWithUppercase = { ...validInput, email: 'TEST@EXAMPLE.COM' };

            try {
                await authService.login(inputWithUppercase);
            } catch (error) {
                // Expected to throw
            }

            expect(mockQueryBuilder.where).toHaveBeenCalledWith(
                'user.email = :email',
                { email: 'test@example.com' }
            );
        });
    });

    describe('getUserById', () => {
        it('should return user when found', async () => {
            const mockUser = {
                id: 'user-123',
                email: 'test@example.com',
            };

            mockUserRepository.findOne.mockResolvedValue(mockUser);

            const result = await authService.getUserById('user-123');

            expect(result).toEqual(mockUser);
            expect(mockUserRepository.findOne).toHaveBeenCalledWith({
                where: { id: 'user-123' },
            });
        });

        it('should return null when user not found', async () => {
            mockUserRepository.findOne.mockResolvedValue(null);

            const result = await authService.getUserById('non-existent');

            expect(result).toBeNull();
        });
    });

    describe('updateProfile', () => {
        it('should update user profile', async () => {
            const mockUser = {
                id: 'user-123',
                fullName: 'Old Name',
            };

            mockUserRepository.findOne.mockResolvedValue(mockUser);
            mockUserRepository.save.mockResolvedValue({
                ...mockUser,
                fullName: 'New Name',
            });

            const result = await authService.updateProfile('user-123', {
                fullName: 'New Name',
            });

            expect(mockUser.fullName).toBe('New Name');
            expect(mockUserRepository.save).toHaveBeenCalledWith(mockUser);
        });

        it('should throw error if user not found', async () => {
            mockUserRepository.findOne.mockResolvedValue(null);

            await expect(
                authService.updateProfile('non-existent', { fullName: 'New Name' })
            ).rejects.toThrow('User not found');
        });

        it('should handle undefined updates gracefully', async () => {
            const mockUser = {
                id: 'user-123',
                fullName: 'Original Name',
            };

            mockUserRepository.findOne.mockResolvedValue(mockUser);
            mockUserRepository.save.mockResolvedValue(mockUser);

            await authService.updateProfile('user-123', {});

            expect(mockUser.fullName).toBe('Original Name');
        });
    });

    describe('changePassword', () => {
        it('should successfully change password', async () => {
            const mockUser = {
                id: 'user-123',
                passwordHash: 'old-hash',
                comparePassword: jest.fn().mockResolvedValue(true),
            };

            mockQueryBuilder.getOne.mockResolvedValue(mockUser);
            mockUserRepository.save.mockResolvedValue(mockUser);

            await authService.changePassword('user-123', 'OldPassword123', 'NewPassword456');

            expect(mockUser.comparePassword).toHaveBeenCalledWith('OldPassword123');
            expect(mockUser.passwordHash).toBe('NewPassword456');
            expect(mockUserRepository.save).toHaveBeenCalledWith(mockUser);
        });

        it('should throw error if user not found', async () => {
            mockQueryBuilder.getOne.mockResolvedValue(null);

            await expect(
                authService.changePassword('non-existent', 'OldPassword123', 'NewPassword456')
            ).rejects.toThrow('User not found');
        });

        it('should throw error if current password is incorrect', async () => {
            const mockUser = {
                comparePassword: jest.fn().mockResolvedValue(false),
            };

            mockQueryBuilder.getOne.mockResolvedValue(mockUser);

            await expect(
                authService.changePassword('user-123', 'WrongPassword', 'NewPassword456')
            ).rejects.toThrow('Current password is incorrect');
        });

        it('should throw error if new password is weak', async () => {
            const mockUser = {
                comparePassword: jest.fn().mockResolvedValue(true),
            };

            mockQueryBuilder.getOne.mockResolvedValue(mockUser);

            await expect(
                authService.changePassword('user-123', 'OldPassword123', 'weak')
            ).rejects.toThrow('New password must be at least 8 characters with uppercase, lowercase, and number');
        });
    });

    describe('Email validation', () => {
        it('should accept valid email formats', async () => {
            mockUserRepository.findOne.mockResolvedValue(null);

            const mockUser = {
                toJSON: jest.fn().mockReturnValue({ id: 'user-123' }),
            };
            mockUserRepository.create.mockReturnValue(mockUser);
            mockUserRepository.save.mockResolvedValue(mockUser);

            const validEmails = [
                'test@example.com',
                'user.name@example.com',
                'user+tag@example.co.uk',
                'user_name@example-domain.com',
            ];

            for (const email of validEmails) {
                await authService.register({
                    email,
                    password: 'Password123',
                });
            }

            expect(mockUserRepository.save).toHaveBeenCalledTimes(validEmails.length);
        });

        it('should reject invalid email formats', async () => {
            mockUserRepository.findOne.mockResolvedValue(null);

            const invalidEmails = [
                'not-an-email',
                '@example.com',
                'user@',
                'user@.com',
                'user space@example.com',
            ];

            for (const email of invalidEmails) {
                await expect(
                    authService.register({
                        email,
                        password: 'Password123',
                    })
                ).rejects.toThrow('Invalid email format');
            }
        });
    });

    describe('Password validation', () => {
        it('should accept valid passwords', async () => {
            mockUserRepository.findOne.mockResolvedValue(null);

            const mockUser = {
                toJSON: jest.fn().mockReturnValue({ id: 'user-123' }),
            };
            mockUserRepository.create.mockReturnValue(mockUser);
            mockUserRepository.save.mockResolvedValue(mockUser);

            const validPasswords = [
                'Password123',
                'MyP@ssw0rd',
                'Secure1Pass',
                'C0mpl3xP@ss',
            ];

            for (const password of validPasswords) {
                await authService.register({
                    email: 'test@example.com',
                    password,
                });
            }

            expect(mockUserRepository.save).toHaveBeenCalledTimes(validPasswords.length);
        });
    });
});
