/* Temporary Node.js type stubs to satisfy the TypeScript compiler in the absence of @types/node. */

declare module 'events' {
    export class EventEmitter {
        on(event: string | symbol, listener: (...args: unknown[]) => void): this;
        off(event: string | symbol, listener: (...args: unknown[]) => void): this;
        emit(event: string | symbol, ...args: unknown[]): boolean;
    }
}

declare module 'child_process' {
    import { EventEmitter } from 'events';

    interface ExecOptions {
        cwd?: string;
        env?: Record<string, string | undefined>;
        timeout?: number;
        signal?: AbortSignal;
    }

    interface ExecException extends Error {
        code?: number;
        killed?: boolean;
        signal?: string;
        stdout?: string;
        stderr?: string;
    }

    interface ExecResult {
        stdout: string;
        stderr: string;
    }

    type ExecCallback = (error: ExecException | null, stdout: string, stderr: string) => void;

    class ChildProcess extends EventEmitter {
        kill(signal?: string): void;
    }

    export function exec(command: string, callback?: ExecCallback): ChildProcess;
    export function exec(command: string, options: ExecOptions, callback?: ExecCallback): ChildProcess;
    export { ExecOptions, ExecResult, ExecException };
}

declare module 'util' {
    export function promisify<TArgs extends unknown[], TResult>(
        fn: (...args: [...TArgs, (error: Error | null, result: TResult) => void]) => void
    ): (...args: TArgs) => Promise<TResult>;
}

declare var process: {
    env: Record<string, string | undefined>;
    cwd(): string;
};

declare module 'fs/promises' {
    export function readFile(path: string, encoding: string): Promise<string>;
    export function writeFile(path: string, data: string, encoding: string): Promise<void>;
    export function mkdir(path: string, options: { recursive: boolean }): Promise<void>;
    export function access(path: string): Promise<void>;
}

declare module 'path' {
    export function join(...parts: string[]): string;
}

declare module 'http' {
    export class Server {
        listen(port: number, callback?: () => void): void;
        close(): void;
    }

    export function createServer(app: unknown): Server;
}
