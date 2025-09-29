import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { applyEdgeChanges, applyNodeChanges, Connection, EdgeChange, NodeChange } from 'react-flow-renderer';
import io from 'socket.io-client';
import { v4 as uuid } from 'uuid';
import Canvas from '../components/Canvas/Canvas';
import NodePanel from '../components/NodePanel/NodePanel';
import WorkflowInspector from '../components/WorkflowInspector/WorkflowInspector';
import WorkflowControls from '../components/WorkflowControls/WorkflowControls';
import {
    createFlowNode,
    FlowEdge,
    FlowNode,
    toWorkflowDefinition,
    fromWorkflowDefinition,
    updateNodeStatus,
} from '@/client/utils/workflowMapper';
import {
    NodeStatusUpdate,
    WorkflowDefinition,
    WorkflowNodeStatus,
    WorkflowNodeType,
    WorkflowRunStatus,
} from '../../shared/types/workflows';
import { CreateLLMApiKeyRequest, LLMApiKeySummary } from '../../shared/types/ai';
import { useAuth } from '../features/auth/AuthProvider';
import { AuthGate } from '../features/auth/AuthGate';
import { API_BASE, apiRequest } from '../utils/api';
import styles from './App.module.css';

const App: React.FC = () => {
    const { user, token, logout } = useAuth();
    const [nodes, setNodes] = useState<FlowNode[]>(() => [
        createFlowNode(uuid(), 'input', { x: 120, y: 240 }),
        createFlowNode(uuid(), 'output', { x: 620, y: 240 }),
    ]);
    const [edges, setEdges] = useState<FlowEdge[]>([]);
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const [workflowMeta, setWorkflowMeta] = useState({
        id: uuid(),
    name: '無題のワークフロー',
        description: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    });
    const [savedWorkflows, setSavedWorkflows] = useState<WorkflowDefinition[]>([]);
    const [apiKeys, setApiKeys] = useState<LLMApiKeySummary[]>([]);
    const [activeRunId, setActiveRunId] = useState<string | null>(null);
    const [runStatus, setRunStatus] = useState<WorkflowRunStatus | null>(null);
    const [isRunning, setIsRunning] = useState(false);
    const activeRunRef = useRef<string | null>(null);

    const isAuthenticated = Boolean(user && token);

    useEffect(() => {
        activeRunRef.current = activeRunId;
    }, [activeRunId]);

    useEffect(() => {
        fetch(`${API_BASE}/api/workflows`)
            .then(async (response) => {
                if (!response.ok) {
                    throw new Error('ワークフローの取得に失敗しました');
                }
                const workflows = (await response.json()) as WorkflowDefinition[];
                setSavedWorkflows(workflows);
            })
            .catch(() => {
                // Non-fatal: ignore and let user create new workflows
            });
    }, []);

    const loadApiKeys = useCallback(async () => {
        if (!token) {
            setApiKeys([]);
            return;
        }
        try {
            const keys = await apiRequest<LLMApiKeySummary[]>('/api/api-keys', { token });
            setApiKeys(keys);
        } catch (error) {
            console.error('Failed to load API keys', error);
            // 静かに失敗し、ユーザー操作に任せる
        }
    }, [token]);

    useEffect(() => {
        if (isAuthenticated) {
            loadApiKeys();
        }
    }, [isAuthenticated, loadApiKeys]);

    const handleCreateApiKey = useCallback(
        async (payload: CreateLLMApiKeyRequest): Promise<LLMApiKeySummary> => {
            if (!token) {
                throw new Error('認証情報が見つかりません。');
            }
            const created = await apiRequest<LLMApiKeySummary>('/api/api-keys', {
                method: 'POST',
                body: JSON.stringify(payload),
                token,
            });
            setApiKeys((current) => {
                const next = current.filter((key) => key.id !== created.id).concat(created);
                return next.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
            });
            return created;
        },
        [token]
    );

    const handleDeleteApiKey = useCallback(
        async (id: string): Promise<void> => {
            if (!token) {
                throw new Error('認証情報が見つかりません。');
            }
            await apiRequest<void>(`/api/api-keys/${id}`, {
                method: 'DELETE',
                token,
            });
            setApiKeys((current) => current.filter((key) => key.id !== id));
        },
        [token]
    );

    useEffect(() => {
        const socket = io(API_BASE);

        socket.on('workflow:node', (payload: unknown) => {
            if (!payload || typeof payload !== 'object') {
                return;
            }

            const { runId, update } = payload as { runId?: string; update?: unknown };
            if (!runId || !update || (activeRunRef.current && runId !== activeRunRef.current)) {
                return;
            }

            setNodes((current: FlowNode[]) => updateNodeStatus(current, update as NodeStatusUpdate));
        });

        socket.on('workflow:status', (payload: unknown) => {
            if (!payload || typeof payload !== 'object') {
                return;
            }

            const { runId, status } = payload as { runId?: string; status?: WorkflowRunStatus };
            if (!runId || !status || (activeRunRef.current && runId !== activeRunRef.current)) {
                return;
            }

            setRunStatus(status);
            if (['success', 'error', 'cancelled'].includes(status.status)) {
                setIsRunning(false);
                setActiveRunId(null);
            }
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    const handleNodesChange = useCallback((changes: NodeChange[]) => {
    setNodes((current: FlowNode[]) => applyNodeChanges(changes, current));
    }, []);

    const handleEdgesChange = useCallback((changes: EdgeChange[]) => {
    setEdges((current: FlowEdge[]) => applyEdgeChanges(changes, current));
    }, []);

    const handleConnect = useCallback((connection: Connection) => {
        if (!connection.source || !connection.target) {
            return;
        }

        setEdges((current: FlowEdge[]) => [
            ...current,
            {
                id: `edge-${uuid()}`,
                source: connection.source!,
                target: connection.target!,
                sourceHandle: connection.sourceHandle ?? undefined,
                targetHandle: connection.targetHandle ?? undefined,
            },
        ]);
    }, []);

    const handleCreateNode = useCallback((type: WorkflowNodeType, position: { x: number; y: number }) => {
    setNodes((current: FlowNode[]) => [...current, createFlowNode(uuid(), type, position)]);
    }, []);

    const handleNodeSelect = useCallback((nodeId: string | null) => {
        setSelectedNodeId(nodeId);
    }, []);

    const handleUpdateNode = useCallback((nodeId: string, updates: { label?: string; config?: Record<string, unknown> }) => {
        setNodes((current: FlowNode[]) =>
            current.map((node: FlowNode) => {
                if (node.id !== nodeId) {
                    return node;
                }

                return {
                    ...node,
                    data: {
                        ...node.data,
                        label: updates.label ?? node.data.label,
                        config: updates.config ? { ...node.data.config, ...updates.config } : node.data.config,
                    },
                };
            })
        );
    }, []);

    const handleDeleteNode = useCallback((nodeId: string) => {
    setNodes((current: FlowNode[]) => current.filter((node) => node.id !== nodeId));
    setEdges((current: FlowEdge[]) => current.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
        setSelectedNodeId((current) => (current === nodeId ? null : current));
    }, []);

    const selectedNode = useMemo(() => nodes.find((node) => node.id === selectedNodeId), [nodes, selectedNodeId]);

    const buildWorkflowDefinition = useCallback(
        (timestamp: string): WorkflowDefinition =>
            toWorkflowDefinition(nodes, edges, {
                ...workflowMeta,
                updatedAt: timestamp,
            }),
        [nodes, edges, workflowMeta]
    );

    const handleRun = useCallback(async () => {
        const now = new Date().toISOString();
        const definition = buildWorkflowDefinition(now);

        const response = await fetch(`${API_BASE}/api/workflows/run`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ workflow: definition }),
        });

        if (!response.ok) {
            throw new Error('ワークフローの実行を開始できませんでした');
        }

        const { runId } = (await response.json()) as { runId: string };
        setActiveRunId(runId);
        setIsRunning(true);
        setRunStatus({
            runId,
            workflowId: definition.id,
            status: 'pending',
            startedAt: now,
        });
        setNodes((current: FlowNode[]) =>
            current.map((node: FlowNode) => ({
                ...node,
                data: { ...node.data, status: 'pending' as WorkflowNodeStatus },
            }))
        );
    }, [buildWorkflowDefinition]);

    const handleStop = useCallback(async () => {
        if (!activeRunId) {
            return;
        }

        await fetch(`${API_BASE}/api/workflows/run/${activeRunId}/stop`, {
            method: 'POST',
        });
    }, [activeRunId]);

    const handleSave = useCallback(async () => {
        const timestamp = new Date().toISOString();
        const definition = buildWorkflowDefinition(timestamp);

        const response = await fetch(`${API_BASE}/api/workflows`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(definition),
        });

        if (!response.ok) {
            throw new Error('ワークフローの保存に失敗しました');
        }

        const saved = (await response.json()) as WorkflowDefinition;
        setWorkflowMeta({
            id: saved.id,
            name: saved.name,
            description: saved.description ?? '',
            createdAt: saved.createdAt,
            updatedAt: saved.updatedAt,
        });
        setSavedWorkflows((current) => {
            const exists = current.some((workflow) => workflow.id === saved.id);
            return exists ? current.map((workflow) => (workflow.id === saved.id ? saved : workflow)) : [...current, saved];
        });
    }, [buildWorkflowDefinition]);

    const handleLoadWorkflow = useCallback((workflow: WorkflowDefinition) => {
        const { nodes: nextNodes, edges: nextEdges } = fromWorkflowDefinition(workflow);
        setNodes(nextNodes);
        setEdges(nextEdges);
        setWorkflowMeta({
            id: workflow.id,
            name: workflow.name,
            description: workflow.description ?? '',
            createdAt: workflow.createdAt,
            updatedAt: workflow.updatedAt,
        });
        setRunStatus(null);
        setActiveRunId(null);
        setIsRunning(false);
    }, []);

    if (!isAuthenticated) {
        return <AuthGate />;
    }

    return (
        <div className={styles.app}>
            <WorkflowControls
                workflowName={workflowMeta.name}
                onNameChange={(value: string) => setWorkflowMeta((meta) => ({ ...meta, name: value }))}
                isRunning={isRunning}
                onRun={handleRun}
                onStop={handleStop}
                onSave={handleSave}
                userName={user?.username}
                onLogout={logout}
            />
            <div className={styles.workspace}>
                <NodePanel />
                <Canvas
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={handleNodesChange}
                    onEdgesChange={handleEdgesChange}
                    onConnect={handleConnect}
                    onNodeSelect={handleNodeSelect}
                    onCreateNode={handleCreateNode}
                />
                <WorkflowInspector
                    selectedNode={selectedNode}
                    onUpdateNode={handleUpdateNode}
                    onDeleteNode={handleDeleteNode}
                    runStatus={runStatus ? { status: runStatus.status, message: runStatus.error ?? runStatus.message } : null}
                    savedWorkflows={savedWorkflows}
                    onLoadWorkflow={handleLoadWorkflow}
                    apiKeys={apiKeys}
                    onCreateApiKey={handleCreateApiKey}
                    onDeleteApiKey={handleDeleteApiKey}
                />
            </div>
        </div>
    );
};

export default App;