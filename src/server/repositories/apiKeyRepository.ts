import { v4 as uuid } from 'uuid';
import { query, run } from '../db/client';
import type { LLMApiKeyRecord } from '../../shared/types/ai';

const BASE_SELECT = `
    SELECT
        id,
        user_id AS userId,
        name,
        provider,
        key,
        created_at AS createdAt,
        updated_at AS updatedAt
    FROM api_keys
`;

function mapRecord(row: Record<string, unknown>): LLMApiKeyRecord {
    return {
        id: String(row.id),
        userId: String(row.userId),
        name: String(row.name),
        provider: String(row.provider),
        key: String(row.key),
        createdAt: String(row.createdAt),
        updatedAt: String(row.updatedAt),
    };
}

export interface CreateApiKeyParams {
    userId: string;
    name: string;
    provider: string;
    key: string;
}

export interface UpdateApiKeyParams {
    name?: string;
    provider?: string;
    key?: string;
}

export class ApiKeyRepository {
    public async listByUser(userId: string): Promise<LLMApiKeyRecord[]> {
        const rows = await query(`${BASE_SELECT} WHERE user_id = ? ORDER BY created_at DESC`, [userId]);
        return rows.map((row) => mapRecord(row));
    }

    public async findById(id: string): Promise<LLMApiKeyRecord | null> {
        const rows = await query(`${BASE_SELECT} WHERE id = ? LIMIT 1`, [id]);
        if (rows.length === 0) {
            return null;
        }
        return mapRecord(rows[0]);
    }

    public async findByIdForUser(id: string, userId: string): Promise<LLMApiKeyRecord | null> {
        const rows = await query(`${BASE_SELECT} WHERE id = ? AND user_id = ? LIMIT 1`, [id, userId]);
        if (rows.length === 0) {
            return null;
        }
        return mapRecord(rows[0]);
    }

    public async create(params: CreateApiKeyParams): Promise<LLMApiKeyRecord> {
        const id = uuid();
        const now = new Date().toISOString();
        await run(
            `INSERT INTO api_keys (id, user_id, name, provider, key, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [id, params.userId, params.name, params.provider, params.key, now, now]
        );
        const record = await this.findById(id);
        if (!record) {
            throw new Error('APIキーの作成結果を取得できませんでした。');
        }
        return record;
    }

    public async update(id: string, userId: string, params: UpdateApiKeyParams): Promise<LLMApiKeyRecord | null> {
        const existing = await this.findByIdForUser(id, userId);
        if (!existing) {
            return null;
        }

        const next: LLMApiKeyRecord = {
            ...existing,
            name: params.name !== undefined ? params.name : existing.name,
            provider: params.provider !== undefined ? params.provider : existing.provider,
            key: params.key !== undefined ? params.key : existing.key,
            updatedAt: new Date().toISOString(),
        };

        await run(
            `UPDATE api_keys
             SET name = ?, provider = ?, key = ?, updated_at = ?
             WHERE id = ? AND user_id = ?`,
            [next.name, next.provider, next.key, next.updatedAt, id, userId]
        );

        return next;
    }

    public async delete(id: string, userId: string): Promise<boolean> {
        const rows = await query('DELETE FROM api_keys WHERE id = ? AND user_id = ? RETURNING id', [id, userId]);
        return rows.length > 0;
    }
}
