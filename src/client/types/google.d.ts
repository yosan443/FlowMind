export {};

declare global {
    interface Window {
        google?: {
            accounts?: {
                id?: {
                    initialize: (config: {
                        client_id: string;
                        callback: (response: { credential?: string }) => void;
                        ux_mode?: 'popup' | 'redirect';
                        auto_select?: boolean;
                        cancel_on_tap_outside?: boolean;
                    }) => void;
                    renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void;
                    prompt: (momentListener?: (notification: unknown) => void) => void;
                };
            };
        };
    }
}
