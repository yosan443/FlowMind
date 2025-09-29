declare module 'socket.io-client' {
    export interface Socket {
        on(event: string, listener: (...args: unknown[]) => void): Socket;
        off(event: string, listener?: (...args: unknown[]) => void): Socket;
        emit(event: string, ...args: unknown[]): Socket;
        disconnect(): void;
    }

    export default function io(url: string, options?: Record<string, unknown>): Socket;
}
