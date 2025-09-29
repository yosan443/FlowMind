import { Edge, Node, XYPosition } from 'react-flow-renderer';
import {
    NodeStatusUpdate,
    WorkflowDefinition,
    WorkflowEdge,
    WorkflowNode,
    WorkflowNodeStatus,
    WorkflowNodeType,
} from '../../shared/types/workflows';

export interface FlowNodeData {
    nodeType: WorkflowNodeType;
    label: string;
    status: WorkflowNodeStatus;
    config: Record<string, unknown>;
    outputPreview?: string;
    message?: string;
}

export type FlowNode = Node<FlowNodeData>;
export type FlowEdge = Edge;

interface WorkflowMeta {
    id: string;
    name: string;
    description?: string;
    createdAt: string;
    updatedAt: string;
}

const DEFAULT_LABELS: Record<WorkflowNodeType, string> = {
    input: '入力',
    output: '出力',
    llm: 'LLM 呼び出し',
    command: 'コマンド実行',
    memoryWrite: 'メモリ書き込み',
    memoryRead: 'メモリ読み取り',
};

const DEFAULT_CONFIG: Record<WorkflowNodeType, Record<string, unknown>> = {
    input: { prompt: '' },
    output: { display: '' },
    llm: {
        provider: 'openai',
        model: 'gpt-4o-mini',
        systemPrompt: '',
        temperature: 0.7,
        maxTokens: 512,
    },
    command: {
        command: '',
        useInputAsArgs: true,
    },
    memoryWrite: { key: '' },
    memoryRead: { key: '' },
};

const LLM_PROVIDERS = ['openai', 'anthropic', 'google'] as const;
type LLMProvider = (typeof LLM_PROVIDERS)[number];

export function createFlowNode(id: string, nodeType: WorkflowNodeType, position: XYPosition): FlowNode {
    return {
        id,
        type: 'flowmindNode',
        position,
        data: {
            nodeType,
            label: DEFAULT_LABELS[nodeType],
            status: 'idle',
            config: { ...DEFAULT_CONFIG[nodeType] },
        },
    };
}

export function toWorkflowDefinition(nodes: FlowNode[], edges: FlowEdge[], meta: WorkflowMeta): WorkflowDefinition {
    const workflowNodes = nodes.map((node) => flowNodeToWorkflowNode(node));
    const workflowEdges = edges.map((edge) => flowEdgeToWorkflowEdge(edge));

    return {
        ...meta,
        nodes: workflowNodes,
        edges: workflowEdges,
    };
}

export function fromWorkflowDefinition(workflow: WorkflowDefinition): { nodes: FlowNode[]; edges: FlowEdge[] } {
    const nodes = workflow.nodes.map((node) => {
        const base = createFlowNode(node.id, node.type, node.position);
        return {
            ...base,
            data: {
                ...base.data,
                label: node.label,
                config: workflowNodeToConfig(node),
            },
        };
    });

    const edges = workflow.edges.map((edge) => workflowEdgeToFlowEdge(edge));

    return { nodes, edges };
}

export function updateNodeStatus(nodes: FlowNode[], update: NodeStatusUpdate): FlowNode[] {
    return nodes.map((node) => {
        if (node.id !== update.nodeId) {
            return node;
        }

        return {
            ...node,
            data: {
                ...node.data,
                status: update.status,
                message: update.message,
                outputPreview: update.outputPreview,
            },
        };
    });
}

function flowNodeToWorkflowNode(node: FlowNode): WorkflowNode {
    const { nodeType, label, config } = node.data;

    switch (nodeType) {
        case 'input':
            return {
                id: node.id,
                type: 'input',
                label,
                position: node.position,
                data: {
                    prompt: String(config.prompt ?? ''),
                },
            };
        case 'output':
            return {
                id: node.id,
                type: 'output',
                label,
                position: node.position,
                data: {
                    display: String(config.display ?? ''),
                },
            };
        case 'llm':
            return {
                id: node.id,
                type: 'llm',
                label,
                position: node.position,
                data: {
                    provider: toLLMProvider(config.provider),
                    model: (config.model as string) ?? '',
                    systemPrompt: (config.systemPrompt as string) ?? '',
                    temperature: Number(config.temperature ?? 0.7),
                    maxTokens: Number(config.maxTokens ?? 512),
                    apiKeyRef: (config.apiKeyRef as string) ?? undefined,
                },
            };
        case 'command':
            return {
                id: node.id,
                type: 'command',
                label,
                position: node.position,
                data: {
                    command: (config.command as string) ?? '',
                    useInputAsArgs: Boolean(config.useInputAsArgs ?? true),
                },
            };
        case 'memoryWrite':
            return {
                id: node.id,
                type: 'memoryWrite',
                label,
                position: node.position,
                data: {
                    key: (config.key as string) ?? '',
                },
            };
        case 'memoryRead':
            return {
                id: node.id,
                type: 'memoryRead',
                label,
                position: node.position,
                data: {
                    key: (config.key as string) ?? '',
                },
            };
        default:
            return {
                id: node.id,
                type: 'input',
                label,
                position: node.position,
                data: {
                    prompt: '',
                },
            };
    }
}

function flowEdgeToWorkflowEdge(edge: FlowEdge): WorkflowEdge {
    return {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        sourceHandle: edge.sourceHandle,
        targetHandle: edge.targetHandle,
    };
}

function workflowEdgeToFlowEdge(edge: WorkflowEdge): FlowEdge {
    return {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        sourceHandle: edge.sourceHandle,
        targetHandle: edge.targetHandle,
    };
}

function workflowNodeToConfig(node: WorkflowNode): Record<string, unknown> {
    switch (node.type) {
        case 'input':
            return { prompt: node.data.prompt };
        case 'output':
            return { display: node.data.display };
        case 'llm':
            return {
                provider: node.data.provider,
                model: node.data.model,
                systemPrompt: node.data.systemPrompt,
                temperature: node.data.temperature,
                maxTokens: node.data.maxTokens,
                apiKeyRef: node.data.apiKeyRef,
            };
        case 'command':
            return {
                command: node.data.command,
                useInputAsArgs: node.data.useInputAsArgs,
            };
        case 'memoryWrite':
        case 'memoryRead':
            return { key: node.data.key };
        default:
            return {};
    }
}

function toLLMProvider(value: unknown): LLMProvider {
    return LLM_PROVIDERS.includes(value as LLMProvider) ? (value as LLMProvider) : 'openai';
}
