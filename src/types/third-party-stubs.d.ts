declare module 'socket.io' {
    export class Server {
        constructor(...args: unknown[]);
        emit(event: string, ...args: unknown[]): boolean;
        on(event: string, listener: (...args: unknown[]) => void): this;
    }
}

declare module 'uuid' {
    export function v4(): string;
}

declare module 'express' {
    export interface Request {
        body?: unknown;
        params: Record<string, string>;
        query: Record<string, string | string[]>;
    }

    export interface Response {
        status(code: number): Response;
        json(body: unknown): Response;
        send(body?: unknown): Response;
    }

    export type NextFunction = (...args: unknown[]) => void;

    export interface Router {
        get(path: string, ...handlers: unknown[]): Router;
        post(path: string, ...handlers: unknown[]): Router;
        put(path: string, ...handlers: unknown[]): Router;
        delete(path: string, ...handlers: unknown[]): Router;
        use(...handlers: unknown[]): Router;
    }

    export interface Express {
        use(...handlers: unknown[]): Express;
        listen(port: number, callback?: () => void): void;
    }

    export interface ExpressStatic {
        (): Express;
        Router(): Router;
        json(): unknown;
    }

    const express: ExpressStatic;
    export default express;
    export const Router: ExpressStatic['Router'];
    export const json: ExpressStatic['json'];
}

declare module 'cors' {
    export type CorsOptions = Record<string, unknown>;
    export default function cors(options?: CorsOptions): unknown;
}
