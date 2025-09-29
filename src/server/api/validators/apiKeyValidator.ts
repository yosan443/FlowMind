import { CreateLLMApiKeyRequest, UpdateLLMApiKeyRequest } from '../../../shared/types/ai';

const SUPPORTED_PROVIDERS = new Set(['openai', 'anthropic', 'google']);

export function validateCreateApiKey(input: Partial<CreateLLMApiKeyRequest>): string[] {
    const errors: string[] = [];

    if (!input?.name || typeof input.name !== 'string' || input.name.trim().length === 0) {
        errors.push('APIキー名を入力してください。');
    }

    if (!input?.provider || typeof input.provider !== 'string') {
        errors.push('プロバイダーを選択してください。');
    } else if (!SUPPORTED_PROVIDERS.has(input.provider) && input.provider.trim().length === 0) {
        errors.push('プロバイダーを正しく入力してください。');
    }

    if (!input?.key || typeof input.key !== 'string' || input.key.trim().length === 0) {
        errors.push('APIキーを入力してください。');
    }

    return errors;
}

export function validateUpdateApiKey(input: UpdateLLMApiKeyRequest): string[] {
    const errors: string[] = [];

    if (input.name !== undefined && (typeof input.name !== 'string' || input.name.trim().length === 0)) {
        errors.push('APIキー名は空にできません。');
    }

    if (input.provider !== undefined) {
        if (typeof input.provider !== 'string') {
            errors.push('プロバイダーは文字列で指定してください。');
        } else if (!SUPPORTED_PROVIDERS.has(input.provider) && input.provider.trim().length === 0) {
            errors.push('プロバイダーを正しく入力してください。');
        }
    }

    if (input.key !== undefined && (typeof input.key !== 'string' || input.key.trim().length === 0)) {
        errors.push('APIキーを空文字に更新することはできません。');
    }

    return errors;
}
