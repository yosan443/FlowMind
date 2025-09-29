import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from './AuthProvider';
import styles from './AuthGate.module.css';
import type { LoginWithEmailRequest, RegisterWithEmailRequest } from '../../../shared/types/user';

type Mode = 'login' | 'register';

const initialLoginState: LoginWithEmailRequest = {
    email: '',
    password: '',
};

const initialRegisterState: RegisterWithEmailRequest = {
    email: '',
    username: '',
    password: '',
};

export const AuthGate: React.FC = () => {
    const { loginWithEmail, registerWithEmail, loginWithGoogle, isLoading, googleClientId, googleConfigLoaded } = useAuth();
    const [mode, setMode] = useState<Mode>('login');
    const [loginForm, setLoginForm] = useState(initialLoginState);
    const [registerForm, setRegisterForm] = useState(initialRegisterState);
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [googleInitInProgress, setGoogleInitInProgress] = useState(false);
    const [googleButtonReady, setGoogleButtonReady] = useState(false);
    const googleButtonRef = useRef<HTMLDivElement | null>(null);
    const googleInitializedClientId = useRef<string | null>(null);

    const canSubmit = useMemo(() => {
        if (mode === 'login') {
            return loginForm.email.trim().length > 0 && loginForm.password.length > 0;
        }
        return (
            registerForm.email.trim().length > 0 &&
            registerForm.username.trim().length > 0 &&
            registerForm.password.length >= 8
        );
    }, [mode, loginForm, registerForm]);

    const handleModeChange = useCallback((next: Mode) => {
        setMode(next);
        setError(null);
    }, []);

    const handleSubmit = useCallback(
        async (event: React.FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            if (!canSubmit) {
                return;
            }

            setSubmitting(true);
            setError(null);
            try {
                if (mode === 'login') {
                    await loginWithEmail({
                        email: loginForm.email.trim(),
                        password: loginForm.password,
                    });
                } else {
                    await registerWithEmail({
                        email: registerForm.email.trim(),
                        username: registerForm.username.trim(),
                        password: registerForm.password,
                    });
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : '認証に失敗しました。');
            } finally {
                setSubmitting(false);
            }
        },
        [canSubmit, mode, loginForm, registerForm, loginWithEmail, registerWithEmail]
    );

    const handleGoogleCredential = useCallback(
        async (response: { credential?: string }) => {
            if (!response?.credential) {
                setError('Google認証情報を取得できませんでした。');
                return;
            }

            setSubmitting(true);
            setError(null);
            try {
                await loginWithGoogle({ idToken: response.credential });
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Googleログインに失敗しました。');
            } finally {
                setSubmitting(false);
            }
        },
        [loginWithGoogle]
    );

    const loadGoogleScript = useCallback((): Promise<void> => {
        if (window.google?.accounts?.id) {
            return Promise.resolve();
        }

        return new Promise((resolve, reject) => {
            const existing = document.getElementById('google-identity-services');
            if (existing) {
                existing.addEventListener(
                    'load',
                    () => {
                        resolve(undefined);
                    },
                    { once: true }
                );
                existing.addEventListener(
                    'error',
                    () => {
                        reject(new Error('Google Identity Services の読み込みに失敗しました。'));
                    },
                    { once: true }
                );
                return;
            }

            const script = document.createElement('script');
            script.id = 'google-identity-services';
            script.src = 'https://accounts.google.com/gsi/client';
            script.async = true;
            script.defer = true;
            script.onload = () => resolve(undefined);
            script.onerror = () => reject(new Error('Google Identity Services の読み込みに失敗しました。'));
            document.head.appendChild(script);
        }).then(() => {
            if (!window.google?.accounts?.id) {
                throw new Error('Google Identity Services が利用できません。');
            }
        });
    }, []);

    useEffect(() => {
        if (!googleConfigLoaded) {
            return;
        }

        if (!googleClientId) {
            googleInitializedClientId.current = null;
            setGoogleButtonReady(false);
            setGoogleInitInProgress(false);
            return;
        }

        if (googleInitializedClientId.current === googleClientId) {
            return;
        }

        let cancelled = false;
        setGoogleInitInProgress(true);
        setGoogleButtonReady(false);

        loadGoogleScript()
            .then(() => {
                if (cancelled || !googleClientId) {
                    return;
                }

                if (!window.google?.accounts?.id) {
                    throw new Error('Google Identity Services が利用できません。');
                }

                window.google.accounts.id.initialize({
                    client_id: googleClientId,
                    callback: handleGoogleCredential,
                    ux_mode: 'popup',
                });

                if (googleButtonRef.current) {
                    googleButtonRef.current.innerHTML = '';
                    window.google.accounts.id.renderButton(googleButtonRef.current, {
                        theme: 'filled_blue',
                        size: 'large',
                        shape: 'pill',
                        width: '100%',
                        text: 'signin_with',
                    });
                }

                googleInitializedClientId.current = googleClientId;
                setGoogleButtonReady(true);
                window.google.accounts.id.prompt();
            })
            .catch((err) => {
                console.error('Failed to initialise Google Sign-In', err);
                if (!cancelled) {
                    setError('Googleサインインの初期化に失敗しました。');
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setGoogleInitInProgress(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [googleClientId, googleConfigLoaded, handleGoogleCredential, loadGoogleScript]);

    if (isLoading) {
        return (
            <div className={styles.container}>
                <div className={styles.panel}>
                    <div className={styles.loading}>セッションを確認しています...</div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.panel}>
                <div className={styles.header}>
                    <div className={styles.title}>FlowMind にサインイン</div>
                    <div className={styles.subtitle}>
                        {mode === 'login' ? 'アカウント情報を入力してください。' : '必要な情報を入力して新規登録します。'}
                    </div>
                </div>
                <div className={styles.tabs}>
                    <button
                        type="button"
                        className={`${styles.tabButton} ${mode === 'login' ? styles.tabButtonActive : ''}`}
                        onClick={() => handleModeChange('login')}
                        disabled={submitting}
                    >
                        ログイン
                    </button>
                    <button
                        type="button"
                        className={`${styles.tabButton} ${mode === 'register' ? styles.tabButtonActive : ''}`}
                        onClick={() => handleModeChange('register')}
                        disabled={submitting}
                    >
                        新規登録
                    </button>
                </div>

                {error && <div className={styles.error}>{error}</div>}

                <form className={styles.form} onSubmit={handleSubmit}>
                    <div className={styles.field}>
                        <label className={styles.label} htmlFor="email">
                            メールアドレス
                        </label>
                        <input
                            id="email"
                            className={styles.input}
                            type="email"
                            value={mode === 'login' ? loginForm.email : registerForm.email}
                            onChange={(event) => {
                                const value = event.target.value;
                                if (mode === 'login') {
                                    setLoginForm((prev) => ({ ...prev, email: value }));
                                } else {
                                    setRegisterForm((prev) => ({ ...prev, email: value }));
                                }
                            }}
                            placeholder="you@example.com"
                            autoComplete="email"
                            required
                        />
                    </div>

                    {mode === 'register' && (
                        <div className={styles.field}>
                            <label className={styles.label} htmlFor="username">
                                ユーザー名
                            </label>
                            <input
                                id="username"
                                className={styles.input}
                                value={registerForm.username}
                                onChange={(event) => setRegisterForm((prev) => ({ ...prev, username: event.target.value }))}
                                placeholder="flowmind-user"
                                autoComplete="username"
                                required
                            />
                            <div className={styles.helper}>2文字以上で入力してください。使用可能な文字: 英数字とアンダースコア</div>
                        </div>
                    )}

                    <div className={styles.field}>
                        <label className={styles.label} htmlFor="password">
                            パスワード
                        </label>
                        <input
                            id="password"
                            className={styles.input}
                            type="password"
                            value={mode === 'login' ? loginForm.password : registerForm.password}
                            onChange={(event) => {
                                const value = event.target.value;
                                if (mode === 'login') {
                                    setLoginForm((prev) => ({ ...prev, password: value }));
                                } else {
                                    setRegisterForm((prev) => ({ ...prev, password: value }));
                                }
                            }}
                            placeholder={mode === 'register' ? '最低8文字' : 'パスワード'}
                            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                            required
                        />
                    </div>

                    <button className={styles.submitButton} type="submit" disabled={!canSubmit || submitting}>
                        {mode === 'login' ? 'ログイン' : '新規登録'}
                    </button>
                </form>
                <div className={styles.divider}>
                    <span className={styles.dividerLine} />
                    <span className={styles.dividerLabel}>または</span>
                    <span className={styles.dividerLine} />
                </div>
                <div className={styles.googleContainer}>
                    {googleClientId ? (
                        <>
                            <div ref={googleButtonRef} className={styles.googleButtonWrapper} />
                            {!googleButtonReady && (
                                <div className={styles.googlePlaceholder}>
                                    {googleInitInProgress
                                        ? 'Google サインインを準備中です...'
                                        : 'Googleサインインの読み込みに失敗しました。'}
                                </div>
                            )}
                            <div className={styles.helper}>Googleアカウントで素早くサインインできます。</div>
                        </>
                    ) : googleConfigLoaded ? (
                        <div className={styles.googlePlaceholder}>Googleサインインは現在利用できません。管理者にお問い合わせください。</div>
                    ) : (
                        <div className={styles.googlePlaceholder}>Google設定を読み込み中...</div>
                    )}
                </div>
            </div>
        </div>
    );
};
