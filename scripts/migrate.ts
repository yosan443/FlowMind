import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import { createClient } from '@libsql/client';
import env from '../src/server/config/env';

async function main() {
    if (!env.D1_DATABASE_URL) {
        throw new Error('D1_DATABASE_URL が設定されていません。');
    }

    const client = createClient({
        url: env.D1_DATABASE_URL,
        authToken: env.D1_DATABASE_AUTH_TOKEN || undefined,
    });

    await client.execute(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            applied_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
        );
    `);

    const migrationsDir = join(process.cwd(), 'src', 'server', 'db', 'migrations');
    const files = (await readdir(migrationsDir)).filter((file) => file.endsWith('.sql')).sort();

    const appliedResult = await client.execute({ sql: 'SELECT name FROM schema_migrations' });
    const applied = new Set(
        appliedResult.rows
            .map((row) => (row as Record<string, unknown>).name)
            .filter((value): value is string => typeof value === 'string')
    );

    for (const file of files) {
        if (applied.has(file)) {
            console.log(`Skipping ${file} (already applied)`);
            continue;
        }

        const sqlPath = join(migrationsDir, file);
        const script = await readFile(sqlPath, 'utf-8');
        const statements = script
            .split(/;\s*(?:\r?\n|$)/)
            .map((statement) => statement.trim())
            .filter((statement) => statement.length > 0);

        console.log(`Applying migration ${file} (${statements.length} statements)`);

        for (const statement of statements) {
            await client.execute(statement);
        }

        await client.execute({
            sql: 'INSERT INTO schema_migrations (name) VALUES (?)',
            args: [file],
        });
    }

    console.log('All migrations applied.');
    client.close();
}

main().catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
});
