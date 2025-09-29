import { type NextFunction, type Response } from 'express';
import type { Request as ExpressRequest } from 'express-serve-static-core';
import { AuthService } from '../../services/auth/authService';
import { AuthError } from '../../services/auth/errors';
import type { UserRecord } from '../../../shared/types/user';

export type AuthenticatedRequest = ExpressRequest & { user?: UserRecord };

export function createAuthMiddleware(authService: AuthService) {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const rawHeader = req.headers['authorization'] ?? req.headers['Authorization' as keyof typeof req.headers];
    const header = Array.isArray(rawHeader) ? rawHeader[0] : rawHeader;
        if (!header || !header.startsWith('Bearer ')) {
            return res.status(401).json({ message: '認証情報が必要です。' });
        }

        const token = header.slice('Bearer '.length).trim();
        if (!token) {
            return res.status(401).json({ message: '認証トークンが無効です。' });
        }

        try {
            const user = await authService.verifyAccessToken(token);
            req.user = user;
            return next();
        } catch (error) {
            if (error instanceof AuthError) {
                return res.status(error.status).json({ message: error.message });
            }
            console.error('Failed to authenticate request', error);
            return res.status(401).json({ message: '認証に失敗しました。' });
        }
    };
}
