import { Request, Response } from 'express';
import { AuthService } from '../../services/auth/authService';
import { validateLoginWithEmail, validateLoginWithGoogle, validateRegisterWithEmail } from '../validators/authValidator';
import type { LoginWithEmailRequest, LoginWithGoogleRequest, RegisterWithEmailRequest } from '../../../shared/types/user';
import type { AuthenticatedRequest } from '../middleware/authMiddleware';
import { AuthError } from '../../services/auth/errors';

export class AuthController {
    constructor(private readonly authService: AuthService) {}

    public registerWithEmail = async (req: Request, res: Response) => {
        const payload = req.body as RegisterWithEmailRequest;
        const errors = validateRegisterWithEmail(payload);
        if (errors.length > 0) {
            return res.status(400).json({ message: '入力内容を確認してください。', errors });
        }

        try {
            const result = await this.authService.registerWithEmail(payload);
            return res.status(201).json(result);
        } catch (error) {
            if (error instanceof AuthError) {
                return res.status(error.status).json({ message: error.message });
            }
            console.error('Failed to register user', error);
            return res.status(500).json({ message: 'ユーザー登録中にエラーが発生しました。' });
        }
    };

    public loginWithEmail = async (req: Request, res: Response) => {
        const payload = req.body as LoginWithEmailRequest;
        const errors = validateLoginWithEmail(payload);
        if (errors.length > 0) {
            return res.status(400).json({ message: '入力内容を確認してください。', errors });
        }

        try {
            const result = await this.authService.loginWithEmail(payload);
            return res.status(200).json(result);
        } catch (error) {
            if (error instanceof AuthError) {
                return res.status(error.status).json({ message: error.message });
            }
            console.error('Failed to login user', error);
            return res.status(500).json({ message: 'ログイン処理中にエラーが発生しました。' });
        }
    };

    public loginWithGoogle = async (req: Request, res: Response) => {
        const payload = req.body as LoginWithGoogleRequest;
        const errors = validateLoginWithGoogle(payload);
        if (errors.length > 0) {
            return res.status(400).json({ message: 'Google認証情報を確認してください。', errors });
        }

        try {
            const result = await this.authService.loginWithGoogle(payload);
            return res.status(200).json(result);
        } catch (error) {
            if (error instanceof AuthError) {
                return res.status(error.status).json({ message: error.message });
            }
            console.error('Failed to login with Google', error);
            return res.status(500).json({ message: 'Googleログイン処理中にエラーが発生しました。' });
        }
    };

    public me = async (req: Request, res: Response) => {
        const { user } = req as AuthenticatedRequest;
        if (!user) {
            return res.status(401).json({ message: '認証情報が必要です。' });
        }

        const profile = await this.authService.getPublicProfile(user.id);
        if (!profile) {
            return res.status(404).json({ message: 'ユーザーが見つかりません。' });
        }

        return res.status(200).json({ user: profile });
    };

    public config = async (_req: Request, res: Response) => {
        const clientId = this.authService.getGoogleClientId();
        return res.status(200).json({ googleClientId: clientId });
    };
}
