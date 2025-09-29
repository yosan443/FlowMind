import { EventEmitter } from 'events';
import { exec } from 'child_process';
import { topologicalSort, WorkflowTopologyError } from './topology';
import {
    CommandNode,
    InputNode,
    LLMNode,
    MemoryReadNode,
    MemoryWriteNode,
    NodeStatusUpdate,
    OutputNode,
    WorkflowDefinition,
    WorkflowEdge,
    WorkflowNode,
    WorkflowRunStatus,
} from '../../shared/types/workflows';

const execAsync = (command: string, options?: { timeout?: number; signal?: AbortSignal }): Promise<{ stdout: string; stderr: string }> =>
    new Promise((resolve, reject) => {
        const child = exec(command, options ?? {}, (error, stdout, stderr) => {
            if (error) {
                const enrichedError = Object.assign(error, { stdout, stderr });
                reject(enrichedError);
                return;
            }
            resolve({ stdout, stderr });
        });

        if (options?.signal) {
            options.signal.addEventListener('abort', () => {
                child.kill();
            });
        }
    });

export type WorkflowEngineEvents = {
    node: (update: NodeStatusUpdate) => void;
    workflow: (status: WorkflowRunStatus) => void;
    log: (payload: { level: 'info' | 'error'; message: string }) => void;
};

export interface WorkflowEngineOptions {
    runId: string;
    workflow: WorkflowDefinition;
    initialInputs?: Record<string, string>;
    sharedMemory?: Record<string, unknown>;
    apiKeyProvider?: (ref: string) => Promise<string | undefined>;
}

export interface WorkflowEngineResult {
    runStatus: WorkflowRunStatus;
    sharedMemory: Record<string, unknown>;
}

type NodeExecutionResult = unknown;

type NodeExecutor = (
    node: WorkflowNode,
    incomingValues: NodeExecutionResult[],
    context: WorkflowExecutionContext
) => Promise<NodeExecutionResult>;

interface WorkflowExecutionContext {
    abortSignal: AbortSignal;
    sharedMemory: Record<string, unknown>;
    emitLog: (message: string) => void;
    initialInputs: Record<string, string> | undefined;
}

export class WorkflowEngine extends EventEmitter {
    private readonly workflow: WorkflowDefinition;
    private readonly runId: string;
    private readonly initialInputs?: Record<string, string>;
    private readonly sharedMemory: Record<string, unknown>;
    private readonly abortController = new AbortController();
    private readonly apiKeyProvider?: (ref: string) => Promise<string | undefined>;

    constructor(options: WorkflowEngineOptions) {
        super();
        this.workflow = options.workflow;
        this.runId = options.runId;
        this.initialInputs = options.initialInputs;
        this.sharedMemory = options.sharedMemory ?? {};
        this.apiKeyProvider = options.apiKeyProvider;
    }

    public get id(): string {
        return this.runId;
    }

    public cancel(): void {
        if (!this.abortController.signal.aborted) {
            this.abortController.abort();
            this.emitWorkflowStatus({
                status: 'cancelled',
                message: 'Workflow execution cancelled by user.',
            });
        }
    }

    public async run(): Promise<WorkflowEngineResult> {
        const workflowStart = new Date().toISOString();
        this.emitWorkflowStatus({ status: 'running', startedAt: workflowStart });

        try {
            const executionOrder = topologicalSort(this.workflow.nodes, this.workflow.edges);
            const nodeOutputs = new Map<string, NodeExecutionResult>();
            const context: WorkflowExecutionContext = {
                abortSignal: this.abortController.signal,
                sharedMemory: this.sharedMemory,
                emitLog: (message: string) => this.emitLog(message),
                initialInputs: this.initialInputs,
            };

            // Pre-emit pending state for all nodes
            for (const node of this.workflow.nodes) {
                this.emitNodeStatus({ nodeId: node.id, status: 'pending' });
            }

            let finalOutput: string | undefined;

            for (const nodeId of executionOrder) {
                if (this.abortController.signal.aborted) {
                    this.emitNodeStatus({ nodeId, status: 'cancelled', message: 'Execution aborted.' });
                    continue;
                }

                const node = this.requireNode(nodeId);
                this.emitNodeStatus({ nodeId, status: 'running' });

                try {
                    const incomingValues = this.collectIncomingValues(node.id, nodeOutputs, this.workflow.edges);
                    const result = await this.executeNode(node, incomingValues, context);
                    nodeOutputs.set(node.id, result);

                    if (node.type === 'output') {
                        finalOutput = this.stringifyOutput(result);
                    }

                    this.emitNodeStatus({ nodeId, status: 'success', outputPreview: this.previewOutput(result) });
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : String(error);
                    this.emitNodeStatus({ nodeId, status: 'error', message: errorMessage });
                    this.emitWorkflowStatus({
                        status: 'error',
                        startedAt: workflowStart,
                        finishedAt: new Date().toISOString(),
                        error: errorMessage,
                    });
                    throw error;
                }
            }

            const runStatus = this.emitWorkflowStatus({
                status: 'success',
                startedAt: workflowStart,
                finishedAt: new Date().toISOString(),
                output: finalOutput,
            });
            return { runStatus, sharedMemory: this.sharedMemory };
        } catch (error) {
            if (error instanceof WorkflowTopologyError) {
                this.emitLog(`Topology error: ${error.message}`);
            } else {
                this.emitLog(`Execution error: ${String(error)}`);
            }
            throw error;
        }
    }

    private requireNode(nodeId: string): WorkflowNode {
        const node = this.workflow.nodes.find((candidate) => candidate.id === nodeId);
        if (!node) {
            throw new Error(`Node with id ${nodeId} not found in workflow.`);
        }
        return node;
    }

    private collectIncomingValues(
        nodeId: string,
        outputs: Map<string, NodeExecutionResult>,
        edges: WorkflowEdge[]
    ): NodeExecutionResult[] {
        const incomingEdges = edges.filter((edge) => edge.target === nodeId);
        return incomingEdges.map((edge) => outputs.get(edge.source));
    }

    private async executeNode(
        node: WorkflowNode,
        incomingValues: NodeExecutionResult[],
        context: WorkflowExecutionContext
    ): Promise<NodeExecutionResult> {
        const executor = this.getExecutor(node);
        return executor(node, incomingValues, context);
    }

    private getExecutor(node: WorkflowNode): NodeExecutor {
        switch (node.type) {
            case 'input':
                return this.executeInputNode;
            case 'llm':
                return this.executeLLMNode;
            case 'command':
                return this.executeCommandNode;
            case 'memoryWrite':
                return this.executeMemoryWriteNode;
            case 'memoryRead':
                return this.executeMemoryReadNode;
            case 'output':
                return this.executeOutputNode;
            default:
                throw new Error(`Unsupported node type: ${(node as WorkflowNode).type}`);
        }
    }

    private async executeInputNode(node: WorkflowNode, incoming: NodeExecutionResult[], context: WorkflowExecutionContext) {
        const typed = node as InputNode;
        if (incoming.length > 0) {
            context.emitLog(`Input node ${node.id} ignoring incoming values.`);
        }
        const override = context.initialInputs?.[node.id];
        return override ?? typed.data.prompt ?? '';
    }

    private async executeLLMNode(node: WorkflowNode, incoming: NodeExecutionResult[], context: WorkflowExecutionContext) {
        const typed = node as LLMNode;
        const [input] = incoming;
        const userPrompt = typeof input === 'string' ? input : JSON.stringify(input ?? '');

        if (context.abortSignal.aborted) {
            throw new Error('Execution aborted');
        }

        if (typed.data.provider !== 'openai') {
            throw new Error(`Provider ${typed.data.provider} is not yet supported in this MVP.`);
        }

        const apiKey = await this.resolveApiKey(typed);

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: typed.data.model,
                temperature: typed.data.temperature,
                max_tokens: typed.data.maxTokens,
                messages: [
                    ...(typed.data.systemPrompt
                        ? [
                              {
                                  role: 'system',
                                  content: typed.data.systemPrompt,
                              },
                          ]
                        : []),
                    {
                        role: 'user',
                        content: userPrompt,
                    },
                ],
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`OpenAI API error: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const json = (await response.json()) as {
            choices: { message?: { content?: string } }[];
        };

        const answer = json.choices?.[0]?.message?.content ?? '';
        return answer.trim();
    }

    private async executeCommandNode(node: WorkflowNode, incoming: NodeExecutionResult[], context: WorkflowExecutionContext) {
        const typed = node as CommandNode;
        const [input] = incoming;
        const args = typed.data.useInputAsArgs && input ? String(input) : '';
        const commandToRun = args ? `${typed.data.command} ${args}` : typed.data.command;

        context.emitLog(`Executing command: ${commandToRun}`);

        const { stdout, stderr } = await execAsync(commandToRun, {
            signal: context.abortSignal as unknown as AbortSignal,
            timeout: 1000 * 60,
        }).catch((error: Error & { stdout?: string; stderr?: string }) => {
            if ('stdout' in error || 'stderr' in error) {
                const stderrOutput = error.stderr ?? error.message;
                throw new Error(`Command failed: ${stderrOutput}`);
            }
            throw error;
        });

        if (stderr) {
            context.emitLog(`Command stderr: ${stderr}`);
        }

        return stdout.trim();
    }

    private async executeMemoryWriteNode(node: WorkflowNode, incoming: NodeExecutionResult[], context: WorkflowExecutionContext) {
        const typed = node as MemoryWriteNode;
        const [value] = incoming;
        context.sharedMemory[typed.data.key] = value;
        return value;
    }

    private async executeMemoryReadNode(node: WorkflowNode, _incoming: NodeExecutionResult[], context: WorkflowExecutionContext) {
        const typed = node as MemoryReadNode;
        const value = context.sharedMemory[typed.data.key];
        if (value === undefined) {
            throw new Error(`Shared memory key "${typed.data.key}" not found.`);
        }
        return value;
    }

    private async executeOutputNode(node: WorkflowNode, incoming: NodeExecutionResult[], _context: WorkflowExecutionContext) {
        const typed = node as OutputNode;
        const [value] = incoming;
        const printable = typeof value === 'string' ? value : JSON.stringify(value ?? '', null, 2);
        typed.data.display = printable;
        return printable;
    }

    private emitNodeStatus(update: NodeStatusUpdate) {
        const payload: NodeStatusUpdate = { ...update };
        this.emit('node', payload);
    }

    private emitWorkflowStatus(partial: Partial<WorkflowRunStatus> & { status: WorkflowRunStatus['status'] }): WorkflowRunStatus {
        const status: WorkflowRunStatus = {
            runId: this.runId,
            workflowId: this.workflow.id,
            startedAt: partial.startedAt ?? new Date().toISOString(),
            finishedAt: partial.finishedAt,
            status: partial.status,
            output: partial.output,
            error: partial.error,
            message: partial.message,
        };
        this.emit('workflow', status);
        return status;
    }

    private emitLog(message: string) {
        this.emit('log', { level: 'info', message });
    }

    private stringifyOutput(value: unknown): string {
        if (typeof value === 'string') {
            return value;
        }
        if (value === undefined) {
            return '';
        }
        return JSON.stringify(value, null, 2);
    }

    private previewOutput(value: unknown): string | undefined {
        if (value === undefined) {
            return undefined;
        }
        const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
        return stringValue.length > 200 ? `${stringValue.slice(0, 200)}…` : stringValue;
    }

    private async resolveApiKey(node: LLMNode): Promise<string> {
        if (node.data.apiKeyRef && this.apiKeyProvider) {
            const stored = await this.apiKeyProvider(node.data.apiKeyRef);
            if (stored && stored.trim().length > 0) {
                return stored;
            }
            throw new Error('指定されたAPIキーが見つかりません。');
        }

        const envKey = process.env.OPENAI_API_KEY;
        if (envKey && envKey.trim().length > 0) {
            return envKey;
        }

        throw new Error('OpenAIのAPIキーが設定されていません。');
    }
}
export interface WorkflowEngine {
    on(event: 'node', listener: WorkflowEngineEvents['node']): this;
    on(event: 'workflow', listener: WorkflowEngineEvents['workflow']): this;
    on(event: 'log', listener: WorkflowEngineEvents['log']): this;
    emit(event: 'node', update: NodeStatusUpdate): boolean;
    emit(event: 'workflow', status: WorkflowRunStatus): boolean;
    emit(event: 'log', payload: { level: 'info' | 'error'; message: string }): boolean;
}
