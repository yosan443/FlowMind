export const API_BASE =
    (typeof window !== 'undefined' && (window as any).__FLOWMIND_API_BASE__) || 'http://localhost:5000';

interface FetchOptions extends RequestInit {
    token?: string | null;
}

export async function apiRequest<T = unknown>(path: string, options: FetchOptions = {}): Promise<T> {
    const { token, headers, ...rest } = options;
    const response = await fetch(`${API_BASE}${path}`, {
        ...rest,
        headers: {
            'Content-Type': 'application/json',
            ...(headers ?? {}),
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
    });

    if (!response.ok) {
        let message = 'サーバーへのリクエストに失敗しました。';
        try {
            const data = await response.json();
            if (Array.isArray((data as any)?.errors) && (data as any).errors.length > 0) {
                message = (data as any).errors.join('\n');
            } else if (typeof (data as any)?.message === 'string') {
                message = (data as any).message;
            }
        } catch {
            // Ignore JSON parse errors
        }
        throw new Error(message);
    }

    if (response.status === 204) {
        return undefined as unknown as T;
    }

    return (await response.json()) as T;
}
