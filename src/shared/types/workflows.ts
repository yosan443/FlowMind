export type WorkflowNodeType =
    | 'input'
    | 'output'
    | 'llm'
    | 'command'
    | 'memoryWrite'
    | 'memoryRead';

export type WorkflowNodeStatus = 'idle' | 'pending' | 'running' | 'success' | 'error' | 'cancelled';

export interface BaseWorkflowNode<TType extends WorkflowNodeType> {
    id: string;
    type: TType;
    label: string;
    position: {
        x: number;
        y: number;
    };
}

export interface InputNode extends BaseWorkflowNode<'input'> {
    data: {
        prompt: string;
    };
}

export interface OutputNode extends BaseWorkflowNode<'output'> {
    data: {
        display: string;
    };
}

export interface LLMNode extends BaseWorkflowNode<'llm'> {
    data: {
        provider: 'openai' | 'anthropic' | 'google';
        model: string;
        systemPrompt: string;
        temperature: number;
        maxTokens: number;
        apiKeyRef?: string;
    };
}

export interface CommandNode extends BaseWorkflowNode<'command'> {
    data: {
        command: string;
        useInputAsArgs: boolean;
    };
}

export interface MemoryWriteNode extends BaseWorkflowNode<'memoryWrite'> {
    data: {
        key: string;
    };
}

export interface MemoryReadNode extends BaseWorkflowNode<'memoryRead'> {
    data: {
        key: string;
    };
}

export type WorkflowNode = InputNode | OutputNode | LLMNode | CommandNode | MemoryWriteNode | MemoryReadNode;

export interface WorkflowEdge {
    id: string;
    source: string;
    sourceHandle?: string;
    target: string;
    targetHandle?: string;
}

export interface WorkflowDefinition {
    id: string;
    name: string;
    description?: string;
    nodes: WorkflowNode[];
    edges: WorkflowEdge[];
    createdAt: string;
    updatedAt: string;
}

export interface WorkflowRunRequest {
    workflow: WorkflowDefinition;
    inputOverrides?: Record<string, string>;
}

export interface NodeStatusUpdate {
    nodeId: string;
    status: WorkflowNodeStatus;
    message?: string;
    outputPreview?: string;
}

export interface WorkflowRunStatus {
    runId: string;
    workflowId: string;
    status: 'pending' | 'running' | 'success' | 'error' | 'cancelled';
    startedAt: string;
    finishedAt?: string;
    output?: string;
    error?: string;
    message?: string;
}

export interface WorkflowPersistenceRecord {
    workflows: WorkflowDefinition[];
    updatedAt: string;
}