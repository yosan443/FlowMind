import { LoginWithEmailRequest, LoginWithGoogleRequest, RegisterWithEmailRequest } from '../../../shared/types/user';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateRegisterWithEmail(input: Partial<RegisterWithEmailRequest>): string[] {
    const errors: string[] = [];

    if (!input?.email || typeof input.email !== 'string' || input.email.trim().length === 0) {
        errors.push('メールアドレスを入力してください。');
    } else if (!EMAIL_REGEX.test(input.email.trim().toLowerCase())) {
        errors.push('メールアドレスの形式が正しくありません。');
    }

    if (!input?.username || typeof input.username !== 'string' || input.username.trim().length === 0) {
        errors.push('ユーザー名を入力してください。');
    } else if (input.username.trim().length < 2) {
        errors.push('ユーザー名は2文字以上で入力してください。');
    }

    if (!input?.password || typeof input.password !== 'string') {
        errors.push('パスワードを入力してください。');
    } else if (input.password.length < 8) {
        errors.push('パスワードは8文字以上で入力してください。');
    }

    return errors;
}

export function validateLoginWithEmail(input: Partial<LoginWithEmailRequest>): string[] {
    const errors: string[] = [];

    if (!input?.email || typeof input.email !== 'string' || input.email.trim().length === 0) {
        errors.push('メールアドレスを入力してください。');
    }

    if (!input?.password || typeof input.password !== 'string' || input.password.length === 0) {
        errors.push('パスワードを入力してください。');
    }

    return errors;
}

export function validateLoginWithGoogle(input: Partial<LoginWithGoogleRequest>): string[] {
    const errors: string[] = [];

    if (!input?.idToken || typeof input.idToken !== 'string' || input.idToken.trim().length === 0) {
        errors.push('GoogleのIDトークンが必要です。');
    }

    return errors;
}
