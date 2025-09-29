declare namespace React {
    type ReactNode = any;
    interface FC<P = {}> {
        (props: P & { children?: ReactNode }): ReactNode | null;
    }

    type DragEvent<T = HTMLElement> = any;
    type ChangeEvent<T = HTMLElement> = any;

    function useState<T>(initial: T | (() => T)): [T, (value: T | ((prev: T) => T)) => void];
    function useMemo<T>(factory: () => T, deps: unknown[]): T;
    function useCallback<T extends (...args: never[]) => unknown>(callback: T, deps: unknown[]): T;
    function useEffect(effect: () => void | (() => void), deps?: unknown[]): void;
    function useRef<T>(initial: T | null): { current: T | null };
    const Fragment: unknown;
}

declare module 'react' {
    export = React;
    export as namespace React;

    export type ReactNode = React.ReactNode;
    export type FC<P = {}> = React.FC<P>;
    export type DragEvent<T = HTMLElement> = React.DragEvent<T>;
    export type ChangeEvent<T = HTMLElement> = React.ChangeEvent<T>;
    export const Fragment: typeof React.Fragment;

    export function useState<T>(initial: T | (() => T)): [T, (value: T | ((prev: T) => T)) => void];
    export function useMemo<T>(factory: () => T, deps: unknown[]): T;
    export function useCallback<T extends (...args: never[]) => unknown>(callback: T, deps: unknown[]): T;
    export function useEffect(effect: () => void | (() => void), deps?: unknown[]): void;
    export function useRef<T>(initial: T | null): { current: T | null };
}

declare module 'react-dom' {
    export function render(element: unknown, container: unknown): void;
}

declare global {
    namespace JSX {
        interface IntrinsicElements {
            [elemName: string]: any;
        }
    }
}
