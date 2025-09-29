import {
    CreateLLMApiKeyRequest,
    LLMApiKeyRecord,
    LLMApiKeySummary,
    UpdateLLMApiKeyRequest,
} from '../../../shared/types/ai';
import { ApiKeyRepository } from '../../repositories/apiKeyRepository';

function maskKey(key: string): string {
    if (key.length <= 4) {
        return '*'.repeat(Math.max(key.length - 1, 0)) + key.slice(-1);
    }
    const visible = key.slice(-4);
    return `${'*'.repeat(key.length - 4)}${visible}`;
}

export class ApiKeyService {
    constructor(private readonly repository = new ApiKeyRepository()) {}

    private toSummary(record: LLMApiKeyRecord): LLMApiKeySummary {
        return {
            id: record.id,
            name: record.name,
            provider: record.provider,
            maskedKey: maskKey(record.key),
            createdAt: record.createdAt,
            updatedAt: record.updatedAt,
        };
    }

    public async listKeys(userId: string): Promise<LLMApiKeySummary[]> {
        const records = await this.repository.listByUser(userId);
        return records.map((record) => this.toSummary(record));
    }

    public async getSummary(id: string, userId: string): Promise<LLMApiKeySummary | undefined> {
        const record = await this.repository.findByIdForUser(id, userId);
        return record ? this.toSummary(record) : undefined;
    }

    public async createKey(userId: string, input: CreateLLMApiKeyRequest): Promise<LLMApiKeySummary> {
        const record = await this.repository.create({
            userId,
            name: input.name.trim(),
            provider: input.provider.trim(),
            key: input.key.trim(),
        });
        return this.toSummary(record);
    }

    public async updateKey(
        id: string,
        userId: string,
        updates: UpdateLLMApiKeyRequest
    ): Promise<LLMApiKeySummary | undefined> {
        const record = await this.repository.update(id, userId, {
            name: updates.name?.trim(),
            provider: updates.provider?.trim(),
            key: updates.key?.trim(),
        });
        return record ? this.toSummary(record) : undefined;
    }

    public async deleteKey(id: string, userId: string): Promise<boolean> {
        return this.repository.delete(id, userId);
    }

    public async resolveKeyValue(id: string): Promise<string | undefined> {
        const record = await this.repository.findById(id);
        return record?.key;
    }
}
