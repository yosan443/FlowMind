export interface AIModel {
    id: string;
    name: string;
    description: string;
    version: string;
    parameters: Record<string, any>;
}

export interface AITask {
    id: string;
    modelId: string;
    input: any;
    output: any;
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
    createdAt: Date;
    updatedAt: Date;
}

export interface AIResponse {
    taskId: string;
    result: any;
    error?: string;
}

export type SupportedLLMProvider = 'openai' | 'anthropic' | 'google';

export interface LLMApiKeyRecord {
    id: string;
    userId: string;
    name: string;
    provider: SupportedLLMProvider | string;
    key: string;
    createdAt: string;
    updatedAt: string;
}

export interface LLMApiKeySummary {
    id: string;
    name: string;
    provider: SupportedLLMProvider | string;
    maskedKey: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateLLMApiKeyRequest {
    name: string;
    provider: SupportedLLMProvider | string;
    key: string;
}

export interface UpdateLLMApiKeyRequest {
    name?: string;
    provider?: SupportedLLMProvider | string;
    key?: string;
}

export interface LLMRequest {
    prompt: string;
    modelId?: string;
    temperature?: number;
    maxTokens?: number;
    userId?: string;
    metadata?: Record<string, unknown>;
}

export interface LLMResponse {
    id: string;
    text: string;
    createdAt: Date;
    usage?: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
    raw?: unknown;
}

export interface VisionModel {
    id: string;
    name: string;
    description?: string;
    version: string;
    capabilities: Array<'classification' | 'detection' | 'segmentation' | string>;
}