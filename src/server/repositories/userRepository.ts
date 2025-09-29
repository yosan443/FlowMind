import { v4 as uuid } from 'uuid';
import { query, run } from '../db/client';
import type { UserRecord } from '../../shared/types/user';

export interface CreateUserParams {
    email: string;
    username: string;
    passwordHash?: string | null;
    googleSub?: string | null;
}

export interface UpdateUserParams {
    email?: string;
    username?: string;
    passwordHash?: string | null;
    googleSub?: string | null;
}

const BASE_SELECT = `
    SELECT
        id,
        email,
        username,
        password_hash AS passwordHash,
        google_sub AS googleSub,
        created_at AS createdAt,
        updated_at AS updatedAt
    FROM users
`;

function mapUser(row: Record<string, unknown>): UserRecord {
    return {
        id: String(row.id),
        email: String(row.email),
        username: String(row.username),
        passwordHash: row.passwordHash === undefined ? null : (row.passwordHash as string | null),
        googleSub: row.googleSub === undefined ? null : (row.googleSub as string | null),
        createdAt: String(row.createdAt),
        updatedAt: String(row.updatedAt),
    };
}

export class UserRepository {
    public async create(params: CreateUserParams): Promise<UserRecord> {
        const id = uuid();
        const timestamp = new Date().toISOString();
        await run(
            `INSERT INTO users (id, email, username, password_hash, google_sub, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                id,
                params.email,
                params.username,
                params.passwordHash ?? null,
                params.googleSub ?? null,
                timestamp,
                timestamp,
            ]
        );

        return (await this.findById(id))!;
    }

    public async findById(id: string): Promise<UserRecord | null> {
        const rows = await query(`${BASE_SELECT} WHERE id = ? LIMIT 1`, [id]);
        if (rows.length === 0) {
            return null;
        }
        return mapUser(rows[0]);
    }

    public async findByEmail(email: string): Promise<UserRecord | null> {
        const rows = await query(`${BASE_SELECT} WHERE email = ? LIMIT 1`, [email]);
        if (rows.length === 0) {
            return null;
        }
        return mapUser(rows[0]);
    }

    public async findByUsername(username: string): Promise<UserRecord | null> {
        const rows = await query(`${BASE_SELECT} WHERE username = ? LIMIT 1`, [username]);
        if (rows.length === 0) {
            return null;
        }
        return mapUser(rows[0]);
    }

    public async findByGoogleSub(googleSub: string): Promise<UserRecord | null> {
        const rows = await query(`${BASE_SELECT} WHERE google_sub = ? LIMIT 1`, [googleSub]);
        if (rows.length === 0) {
            return null;
        }
        return mapUser(rows[0]);
    }

    public async list(): Promise<UserRecord[]> {
        const rows = await query(`${BASE_SELECT} ORDER BY created_at DESC`);
        return rows.map((row) => mapUser(row));
    }

    public async update(id: string, params: UpdateUserParams): Promise<UserRecord | null> {
        const existing = await this.findById(id);
        if (!existing) {
            return null;
        }

        const next: UserRecord = {
            ...existing,
            email: params.email ?? existing.email,
            username: params.username ?? existing.username,
            passwordHash: params.passwordHash ?? existing.passwordHash,
            googleSub: params.googleSub ?? existing.googleSub,
            updatedAt: new Date().toISOString(),
        };

        await run(
            `UPDATE users
             SET email = ?, username = ?, password_hash = ?, google_sub = ?, updated_at = ?
             WHERE id = ?`,
            [next.email, next.username, next.passwordHash ?? null, next.googleSub ?? null, next.updatedAt, id]
        );

        return next;
    }

    public async delete(id: string): Promise<boolean> {
        const result = await query<{ changes: number }>('DELETE FROM users WHERE id = ? RETURNING 1 as changes', [id]);
        return result.length > 0;
    }
}