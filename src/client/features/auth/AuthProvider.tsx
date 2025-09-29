import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type {
    AuthSuccessResponse,
    LoginWithEmailRequest,
    LoginWithGoogleRequest,
    PublicUser,
    RegisterWithEmailRequest,
} from '../../../shared/types/user';
import { apiRequest } from '../../utils/api';

interface AuthContextValue {
    user: PublicUser | null;
    token: string | null;
    isLoading: boolean;
    googleClientId: string | null;
    googleConfigLoaded: boolean;
    loginWithEmail: (payload: LoginWithEmailRequest) => Promise<void>;
    registerWithEmail: (payload: RegisterWithEmailRequest) => Promise<void>;
    loginWithGoogle: (payload: LoginWithGoogleRequest) => Promise<void>;
    refreshProfile: () => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORAGE_KEY = 'flowmind.auth';

interface StoredAuthState {
    token: string;
}

function persistToken(token: string) {
    const state: StoredAuthState = { token };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function clearPersistedToken() {
    localStorage.removeItem(STORAGE_KEY);
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<PublicUser | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [googleClientId, setGoogleClientId] = useState<string | null>(null);
    const [googleConfigLoaded, setGoogleConfigLoaded] = useState(false);

    const applyAuthResult = useCallback((result: AuthSuccessResponse) => {
        setUser(result.user);
        setToken(result.tokens.accessToken);
        persistToken(result.tokens.accessToken);
        setIsLoading(false);
    }, []);

    const refreshProfile = useCallback(async () => {
        if (!token) {
            setUser(null);
            return;
        }
        try {
            const response = await apiRequest<{ user: PublicUser }>('/api/auth/me', { token });
            setUser(response.user);
        } catch (error) {
            console.error('Failed to refresh user profile', error);
            setUser(null);
            setToken(null);
            clearPersistedToken();
        }
    }, [token]);

    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) {
            setIsLoading(false);
            return;
        }

        try {
            const parsed = JSON.parse(stored) as StoredAuthState;
            if (parsed?.token) {
                setToken(parsed.token);
                apiRequest<{ user: PublicUser }>('/api/auth/me', { token: parsed.token })
                    .then((response) => {
                        setUser(response.user);
                    })
                    .catch((error) => {
                        console.error('Failed to restore session', error);
                        clearPersistedToken();
                        setUser(null);
                        setToken(null);
                    })
                    .finally(() => {
                        setIsLoading(false);
                    });
                return;
            }
        } catch (error) {
            console.warn('Failed to parse persisted auth state', error);
        }
        setIsLoading(false);
    }, []);

    useEffect(() => {
        apiRequest<{ googleClientId: string | null }>('/api/auth/config')
            .then((response) => {
                setGoogleClientId(response.googleClientId ?? null);
            })
            .catch((error) => {
                console.error('Failed to load auth configuration', error);
                setGoogleClientId(null);
            })
            .finally(() => {
                setGoogleConfigLoaded(true);
            });
    }, []);

    const loginWithEmail = useCallback(
        async (payload: LoginWithEmailRequest) => {
            const result = await apiRequest<AuthSuccessResponse>('/api/auth/login/email', {
                method: 'POST',
                body: JSON.stringify(payload),
            });
            applyAuthResult(result);
        },
        [applyAuthResult]
    );

    const registerWithEmail = useCallback(
        async (payload: RegisterWithEmailRequest) => {
            const result = await apiRequest<AuthSuccessResponse>('/api/auth/register/email', {
                method: 'POST',
                body: JSON.stringify(payload),
            });
            applyAuthResult(result);
        },
        [applyAuthResult]
    );

    const loginWithGoogle = useCallback(
        async (payload: LoginWithGoogleRequest) => {
            const result = await apiRequest<AuthSuccessResponse>('/api/auth/login/google', {
                method: 'POST',
                body: JSON.stringify(payload),
            });
            applyAuthResult(result);
        },
        [applyAuthResult]
    );

    const logout = useCallback(() => {
        setUser(null);
        setToken(null);
        clearPersistedToken();
    }, []);

    const value = useMemo<AuthContextValue>(
        () => ({
            user,
            token,
            isLoading,
            googleClientId,
            googleConfigLoaded,
            loginWithEmail,
            registerWithEmail,
            loginWithGoogle,
            refreshProfile,
            logout,
        }),
        [
            user,
            token,
            isLoading,
            googleClientId,
            googleConfigLoaded,
            loginWithEmail,
            registerWithEmail,
            loginWithGoogle,
            refreshProfile,
            logout,
        ]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return ctx;
}
