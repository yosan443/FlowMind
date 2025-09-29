import { createClient, type Client, type InArgs, type InStatement, type ResultSet } from '@libsql/client';
import env from '../config/env';

let client: Client | null = null;

export function getDbClient(): Client {
    if (!env.D1_DATABASE_URL) {
        throw new Error('D1_DATABASE_URL が設定されていません。');
    }

    if (!client) {
        client = createClient({
            url: env.D1_DATABASE_URL,
            authToken: env.D1_DATABASE_AUTH_TOKEN || undefined,
        });
    }

    return client;
}

export async function execute(statement: InStatement): Promise<ResultSet> {
    const db = getDbClient();
    return db.execute(statement);
}

export async function query<T = Record<string, unknown>>(sql: string, params: InArgs = []): Promise<T[]> {
    const result = await execute({ sql, args: params });
    return result.rows as T[];
}

export async function run(sql: string, params: InArgs = []): Promise<void> {
    await execute({ sql, args: params });
}
