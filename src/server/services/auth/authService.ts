import bcrypt from 'bcryptjs';
import jwt, { type JwtPayload } from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import env from '../../config/env';
import { UserRepository } from '../../repositories/userRepository';
import type { LoginWithGoogleRequest, PublicUser, UserRecord } from '../../../shared/types/user';
import { AuthError } from './errors';

export interface RegisterWithEmailParams {
    email: string;
    username: string;
    password: string;
}

export interface LoginWithEmailParams {
    email: string;
    password: string;
}

export interface AuthTokens {
    accessToken: string;
    expiresIn: number;
}

export interface AuthResult {
    user: PublicUser;
    tokens: AuthTokens;
}

export class AuthService {
    private readonly jwtSecret: string;
    private readonly tokenExpiresInSec: number;
    private readonly googleClient: OAuth2Client | null;
    private readonly googleClientId: string | null;

    constructor(private readonly userRepository: UserRepository, tokenExpiresInSec = 60 * 60 * 12) {
        if (!env.JWT_SECRET || env.JWT_SECRET.length < 16) {
            throw new Error('JWT_SECRET が設定されていないか、十分な長さではありません。');
        }

        this.jwtSecret = env.JWT_SECRET;
        this.tokenExpiresInSec = tokenExpiresInSec;
        this.googleClientId = env.GOOGLE_CLIENT_ID || null;
        this.googleClient = this.googleClientId ? new OAuth2Client(this.googleClientId) : null;
    }

    public async registerWithEmail(params: RegisterWithEmailParams): Promise<AuthResult> {
        const normalizedEmail = params.email.trim().toLowerCase();
        const normalizedUsername = params.username.trim();

        await this.ensureEmailAndUsernameAreAvailable(normalizedEmail, normalizedUsername);

        const passwordHash = await this.hashPassword(params.password);

        const user = await this.userRepository.create({
            email: normalizedEmail,
            username: normalizedUsername,
            passwordHash,
        });

        const tokens = this.createTokens(user);
        return { user: this.toPublicUser(user), tokens };
    }

    public async loginWithEmail(params: LoginWithEmailParams): Promise<AuthResult> {
        const normalizedEmail = params.email.trim().toLowerCase();
        const user = await this.userRepository.findByEmail(normalizedEmail);
        if (!user || !user.passwordHash) {
            throw new AuthError(401, 'メールアドレスまたはパスワードが正しくありません。');
        }

        const valid = await bcrypt.compare(params.password, user.passwordHash);
        if (!valid) {
            throw new AuthError(401, 'メールアドレスまたはパスワードが正しくありません。');
        }

        const tokens = this.createTokens(user);
        return { user: this.toPublicUser(user), tokens };
    }

    public async loginWithGoogle(params: LoginWithGoogleRequest): Promise<AuthResult> {
        const client = this.ensureGoogleClient();

        let ticket;
        try {
            ticket = await client.verifyIdToken({ idToken: params.idToken, audience: env.GOOGLE_CLIENT_ID });
        } catch (error) {
            console.error('Failed to verify Google ID token', error);
            throw new AuthError(401, 'Googleトークンの検証に失敗しました。');
        }

        const payload = ticket.getPayload();
        if (!payload?.sub || !payload.email) {
            throw new AuthError(401, 'Googleのユーザー情報を取得できませんでした。');
        }

        const googleSub = payload.sub;
        const email = payload.email.toLowerCase();
        const displayName = payload.name ?? payload.given_name ?? email.split('@')[0];

        let user = await this.userRepository.findByGoogleSub(googleSub);

        if (!user) {
            const existingByEmail = await this.userRepository.findByEmail(email);
            if (existingByEmail) {
                user =
                    (await this.userRepository.update(existingByEmail.id, {
                        googleSub,
                        email,
                    })) ?? existingByEmail;
            } else {
                const username = await this.generateAvailableUsername(displayName);
                user = await this.userRepository.create({
                    email,
                    username,
                    googleSub,
                });
            }
        }

        const tokens = this.createTokens(user);
        return { user: this.toPublicUser(user), tokens };
    }

    public async verifyAccessToken(token: string): Promise<UserRecord> {
        try {
            const payload = jwt.verify(token, this.jwtSecret) as JwtPayload & { sub?: string };
            const userId = payload.sub;
            if (!userId) {
                throw new AuthError(401, 'アクセストークンの形式が正しくありません。');
            }

            const user = await this.userRepository.findById(userId);
            if (!user) {
                throw new AuthError(401, 'アクセストークンの検証に失敗しました。');
            }
            return user;
        } catch (error) {
            if (error instanceof AuthError) {
                throw error;
            }
            throw new AuthError(401, 'アクセストークンの検証に失敗しました。');
        }
    }

    public async getPublicProfile(userId: string): Promise<PublicUser | null> {
        const user = await this.userRepository.findById(userId);
        if (!user) {
            return null;
        }
        return this.toPublicUser(user);
    }

    public getGoogleClientId(): string | null {
        return this.googleClientId;
    }

    private async ensureEmailAndUsernameAreAvailable(email: string, username: string): Promise<void> {
        const [existingEmail, existingUsername] = await Promise.all([
            this.userRepository.findByEmail(email),
            this.userRepository.findByUsername(username),
        ]);

        if (existingEmail) {
            throw new AuthError(409, 'このメールアドレスは既に登録されています。');
        }

        if (existingUsername) {
            throw new AuthError(409, 'このユーザー名は既に利用されています。');
        }
    }

    private async hashPassword(raw: string): Promise<string> {
        if (!raw || raw.length < 8) {
            throw new AuthError(400, 'パスワードは8文字以上で入力してください。');
        }
        return bcrypt.hash(raw, env.BCRYPT_SALT_ROUNDS);
    }

    private async generateAvailableUsername(desired: string): Promise<string> {
        const base = this.normalizeUsername(desired);
        let candidate = base;
        let counter = 1;

        while (await this.userRepository.findByUsername(candidate)) {
            candidate = `${base}${counter}`;
            counter += 1;
        }

        return candidate;
    }

    private normalizeUsername(input: string): string {
        const trimmed = input.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
        if (trimmed.length >= 2) {
            return trimmed;
        }
        return `user${Math.random().toString(36).slice(2, 8)}`;
    }

    private createTokens(user: UserRecord): AuthTokens {
        const accessToken = jwt.sign({ sub: user.id, email: user.email }, this.jwtSecret, {
            expiresIn: this.tokenExpiresInSec,
        });

        return {
            accessToken,
            expiresIn: this.tokenExpiresInSec,
        };
    }

    private toPublicUser(user: UserRecord): PublicUser {
        return {
            id: user.id,
            email: user.email,
            username: user.username,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };
    }

    private ensureGoogleClient(): OAuth2Client {
        if (!this.googleClient) {
            throw new Error('Google クライアントIDが設定されていません。');
        }
        return this.googleClient;
    }
}
