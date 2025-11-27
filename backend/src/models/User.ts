import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, BeforeInsert, BeforeUpdate } from 'typeorm';
import bcrypt from 'bcrypt';

// Match the database enum 'user_role'
export enum UserRole {
    FREE = 'free',
    PRO = 'pro',
    TEAM_MEMBER = 'team_member',
    TEAM_ADMIN = 'team_admin',
    ENTERPRISE = 'enterprise'
}

@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar', length: 255, unique: true })
    email!: string;

    @Column({ name: 'password_hash', type: 'varchar', length: 255, select: false })
    passwordHash!: string;

    @Column({ name: 'full_name', type: 'varchar', length: 255, nullable: true })
    fullName?: string;

    @Column({ type: 'enum', enum: UserRole, enumName: 'user_role', default: UserRole.FREE })
    role!: UserRole;

    @Column({ name: 'storage_used_bytes', type: 'bigint', default: 0 })
    storageUsedBytes!: number;

    @Column({ name: 'storage_limit_bytes', type: 'bigint', default: 5368709120 }) // 5GB
    storageLimitBytes!: number;

    @Column({ name: 'email_verified', type: 'boolean', default: false })
    emailVerified!: boolean;

    @Column({ name: 'two_factor_enabled', type: 'boolean', default: false })
    twoFactorEnabled!: boolean;

    @Column({ name: 'last_login_at', type: 'timestamptz', nullable: true })
    lastLoginAt?: Date;

    @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
    updatedAt!: Date;

    @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
    deletedAt?: Date;

    @BeforeInsert()
    @BeforeUpdate()
    async hashPassword(): Promise<void> {
        if (this.passwordHash && !this.passwordHash.startsWith('$2b$')) {
            const saltRounds = 10;
            this.passwordHash = await bcrypt.hash(this.passwordHash, saltRounds);
        }
    }

    async comparePassword(candidatePassword: string): Promise<boolean> {
        return bcrypt.compare(candidatePassword, this.passwordHash);
    }

    toJSON(): Omit<User, 'passwordHash' | 'hashPassword' | 'comparePassword' | 'toJSON'> {
        const { passwordHash, ...userWithoutPassword } = this as User & { passwordHash?: string };
        return userWithoutPassword as Omit<User, 'passwordHash' | 'hashPassword' | 'comparePassword' | 'toJSON'>;
    }
}
