import React, { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import {
    WorkflowDefinition,
    WorkflowNodeStatus,
    WorkflowNodeType,
} from '../../../shared/types/workflows';
import { CreateLLMApiKeyRequest, LLMApiKeySummary, SupportedLLMProvider } from '../../../shared/types/ai';
import { FlowNode } from '@/client/utils/workflowMapper';
import styles from './WorkflowInspector.module.css';

interface WorkflowInspectorProps {
    selectedNode?: FlowNode;
    onUpdateNode: (nodeId: string, updates: { label?: string; config?: Record<string, unknown> }) => void;
    onDeleteNode: (nodeId: string) => void;
    runStatus: { status: WorkflowNodeStatus | string; message?: string } | null;
    savedWorkflows: WorkflowDefinition[];
    onLoadWorkflow: (workflow: WorkflowDefinition) => void;
    apiKeys: LLMApiKeySummary[];
    onCreateApiKey: (payload: CreateLLMApiKeyRequest) => Promise<LLMApiKeySummary>;
    onDeleteApiKey: (id: string) => Promise<void>;
}

const STATUS_LABELS: Record<WorkflowNodeStatus | string, string> = {
    idle: '待機中',
    pending: '準備中',
    running: '実行中',
    success: '成功',
    error: 'エラー',
    cancelled: 'キャンセル',
};

const LLM_PROVIDER_OPTIONS: SupportedLLMProvider[] = ['openai', 'anthropic', 'google'];

const WorkflowInspector: React.FC<WorkflowInspectorProps> = ({
    selectedNode,
    onUpdateNode,
    onDeleteNode,
    runStatus,
    savedWorkflows,
    onLoadWorkflow,
    apiKeys,
    onCreateApiKey,
    onDeleteApiKey,
}) => {
    const handleLabelChange = (event: ChangeEvent<HTMLInputElement>) => {
        if (!selectedNode) return;
        onUpdateNode(selectedNode.id, { label: event.target.value });
    };

    const handleConfigUpdate = (changes: Record<string, unknown>) => {
        if (!selectedNode) return;
        onUpdateNode(selectedNode.id, {
            config: {
                ...selectedNode.data.config,
                ...changes,
            },
        });
    };

    const renderNodeConfig = () => {
        if (!selectedNode) {
            return <p className={styles.placeholder}>編集するノードをキャンバス上で選択してください。</p>;
        }

        const { nodeType, config, status, message, outputPreview } = selectedNode.data;

        return (
            <div className={styles.nodeDetails}>
                <header className={styles.nodeHeader}>
                    <span className={styles.badge}>{nodeType}</span>
                    <span className={`${styles.status} ${styles[status]}`}>{STATUS_LABELS[status] ?? status}</span>
                </header>

                <label className={styles.fieldLabel} htmlFor="nodeLabel">
                    表示名
                </label>
                <input
                    id="nodeLabel"
                    className={styles.input}
                    value={selectedNode.data.label}
                    onChange={handleLabelChange}
                    placeholder="ノード名"
                />

                {renderConfigFields(nodeType, config, handleConfigUpdate, {
                    apiKeys,
                    selectedApiKeyRef: String(config.apiKeyRef ?? ''),
                    onSelectApiKey: (ref: string | null) => handleConfigUpdate({ apiKeyRef: ref ?? undefined }),
                    onCreateApiKey,
                    onDeleteApiKey,
                })}

                {outputPreview && (
                    <section className={styles.outputPreview}>
                        <h4>最新の出力</h4>
                        <pre>{outputPreview}</pre>
                    </section>
                )}

                {message && (
                    <p className={styles.statusMessage}>{message}</p>
                )}

                <button className={styles.deleteButton} onClick={() => onDeleteNode(selectedNode.id)}>
                    ノードを削除
                </button>
            </div>
        );
    };

    return (
        <aside className={styles.inspector}>
            <section className={styles.section}>
                <h3>ノード設定</h3>
                {renderNodeConfig()}
            </section>

            <section className={styles.section}>
                <h3>ワークフロー実行</h3>
                {runStatus ? (
                    <div className={`${styles.runStatus} ${styles[runStatus.status]}`}>
                        <span className={styles.statusTitle}>{STATUS_LABELS[runStatus.status] ?? runStatus.status}</span>
                        {runStatus.message && <p>{runStatus.message}</p>}
                    </div>
                ) : (
                    <p className={styles.placeholder}>ワークフローを実行すると進行状況が表示されます。</p>
                )}
            </section>

            <section className={styles.section}>
                <h3>保存済みワークフロー</h3>
                {savedWorkflows.length === 0 ? (
                    <p className={styles.placeholder}>保存済みのワークフローはまだありません。「保存」をクリックしてキャンバスを残しましょう。</p>
                ) : (
                    <ul className={styles.workflowList}>
                        {savedWorkflows.map((workflow) => (
                            <li key={workflow.id} className={styles.workflowListItem}>
                                <div>
                                    <strong>{workflow.name}</strong>
                                    <span>{new Date(workflow.updatedAt).toLocaleString()}</span>
                                </div>
                                <button onClick={() => onLoadWorkflow(workflow)}>読み込み</button>
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </aside>
    );
};

interface LLMConfigExtras {
    apiKeys: LLMApiKeySummary[];
    selectedApiKeyRef?: string;
    onSelectApiKey?: (ref: string | null) => void;
    onCreateApiKey?: (payload: CreateLLMApiKeyRequest) => Promise<LLMApiKeySummary>;
    onDeleteApiKey?: (id: string) => Promise<void>;
}

function renderConfigFields(
    type: WorkflowNodeType,
    config: Record<string, unknown>,
    onChange: (changes: Record<string, unknown>) => void,
    extras?: LLMConfigExtras
) {
    switch (type) {
        case 'input':
            return (
                <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel} htmlFor="inputPrompt">
                        プロンプト
                    </label>
                    <textarea
                        id="inputPrompt"
                        className={styles.textarea}
                        value={String(config.prompt ?? '')}
                        onChange={(event: ChangeEvent<HTMLTextAreaElement>) => onChange({ prompt: event.target.value })}
                        rows={4}
                    />
                </div>
            );
        case 'llm':
            return (
                <>
                    <div className={styles.fieldGroup}>
                        <label className={styles.fieldLabel}>プロバイダー</label>
                        <select
                            className={styles.select}
                            value={String(config.provider ?? 'openai')}
                            onChange={(event: ChangeEvent<HTMLSelectElement>) => onChange({ provider: event.target.value })}
                        >
                            {LLM_PROVIDER_OPTIONS.map((provider) => (
                                <option key={provider} value={provider}>
                                    {provider.charAt(0).toUpperCase() + provider.slice(1)}
                                </option>
                            ))}
                        </select>

                        <label className={styles.fieldLabel}>モデル</label>
                        <input
                            className={styles.input}
                            value={String(config.model ?? '')}
                            onChange={(event: ChangeEvent<HTMLInputElement>) => onChange({ model: event.target.value })}
                            placeholder="gpt-4o"
                        />

                        <label className={styles.fieldLabel}>システムプロンプト</label>
                        <textarea
                            className={styles.textarea}
                            value={String(config.systemPrompt ?? '')}
                            rows={3}
                            onChange={(event: ChangeEvent<HTMLTextAreaElement>) => onChange({ systemPrompt: event.target.value })}
                        />

                        <div className={styles.inlineGroup}>
                            <div>
                                <label className={styles.fieldLabel}>温度</label>
                                <input
                                    type="number"
                                    className={styles.input}
                                    min={0}
                                    max={1}
                                    step={0.1}
                                    value={Number(config.temperature ?? 0.7)}
                                    onChange={(event: ChangeEvent<HTMLInputElement>) =>
                                        onChange({ temperature: Number(event.target.value) })
                                    }
                                />
                            </div>
                            <div>
                                <label className={styles.fieldLabel}>最大トークン数</label>
                                <input
                                    type="number"
                                    className={styles.input}
                                    min={1}
                                    step={1}
                                    value={Number(config.maxTokens ?? 512)}
                                    onChange={(event: ChangeEvent<HTMLInputElement>) =>
                                        onChange({ maxTokens: Number(event.target.value) })
                                    }
                                />
                            </div>
                        </div>
                    </div>
                    <LLMApiKeyManager
                        apiKeys={extras?.apiKeys ?? []}
                        selectedRef={extras?.selectedApiKeyRef}
                        onSelect={extras?.onSelectApiKey}
                        onCreate={extras?.onCreateApiKey}
                        onDelete={extras?.onDeleteApiKey}
                        provider={String(config.provider ?? 'openai')}
                    />
                </>
            );
        case 'command':
            return (
                <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>コマンド</label>
                    <input
                        className={styles.input}
                        placeholder="python script.py"
                        value={String(config.command ?? '')}
                        onChange={(event: ChangeEvent<HTMLInputElement>) => onChange({ command: event.target.value })}
                    />
                    <label className={styles.checkbox}>
                        <input
                            type="checkbox"
                            checked={Boolean(config.useInputAsArgs ?? true)}
                            onChange={(event: ChangeEvent<HTMLInputElement>) => onChange({ useInputAsArgs: event.target.checked })}
                        />
                        上流の出力を引数として渡す
                    </label>
                </div>
            );
        case 'memoryWrite':
        case 'memoryRead':
            return (
                <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>メモリキー</label>
                    <input
                        className={styles.input}
                        value={String(config.key ?? '')}
                        onChange={(event: ChangeEvent<HTMLInputElement>) => onChange({ key: event.target.value })}
                        placeholder="summary"
                    />
                </div>
            );
        case 'output':
            return (
                <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>出力プレビュー</label>
                    <textarea className={styles.textarea} value={String(config.display ?? '')} readOnly rows={4} />
                </div>
            );
        default:
            return null;
    }
}

interface LLMApiKeyManagerProps {
    apiKeys: LLMApiKeySummary[];
    selectedRef?: string;
    provider: string;
    onSelect?: (ref: string | null) => void;
    onCreate?: (payload: CreateLLMApiKeyRequest) => Promise<LLMApiKeySummary>;
    onDelete?: (id: string) => Promise<void>;
}

const LLMApiKeyManager: React.FC<LLMApiKeyManagerProps> = ({
    apiKeys,
    selectedRef,
    provider,
    onSelect,
    onCreate,
    onDelete,
}) => {
    const [name, setName] = useState('');
    const [keyValue, setKeyValue] = useState('');
    const [providerOverride, setProviderOverride] = useState<string>(provider);
    const [isSaving, setIsSaving] = useState(false);
    const [feedback, setFeedback] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    useEffect(() => {
        setProviderOverride(provider);
    }, [provider]);

    const handleSelect = (event: ChangeEvent<HTMLSelectElement>) => {
        const value = event.target.value;
        onSelect?.(value.length > 0 ? value : null);
    };

    const handleCreate = async (event: FormEvent) => {
        event.preventDefault();
        if (!onCreate) {
            return;
        }

        setIsSaving(true);
        setFeedback(null);
        setError(null);

        try {
            const created = await onCreate({
                name: name.trim(),
                provider: (providerOverride as SupportedLLMProvider | string) ?? 'openai',
                key: keyValue.trim(),
            });
            setFeedback(`${created.name} を保存しました。`);
            setName('');
            setKeyValue('');
            onSelect?.(created.id);
        } catch (createError) {
            const message = createError instanceof Error ? createError.message : 'APIキーの保存に失敗しました。';
            setError(message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!onDelete) {
            return;
        }
        setDeletingId(id);
        setFeedback(null);
        setError(null);
        try {
            await onDelete(id);
            setFeedback('APIキーを削除しました。');
        } catch (deleteError) {
            const message = deleteError instanceof Error ? deleteError.message : 'APIキーの削除に失敗しました。';
            setError(message);
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>保存済みAPIキー</label>
            <select className={styles.select} value={selectedRef ?? ''} onChange={handleSelect}>
                <option value="">環境変数 (OPENAI_API_KEY) を使用</option>
                {apiKeys.map((key) => (
                    <option key={key.id} value={key.id}>
                        {key.name} ({key.maskedKey})
                    </option>
                ))}
            </select>
            <p className={styles.helperText}>保存済みのキーを選択するか、環境変数を利用できます。</p>

            <form className={styles.apiKeyForm} onSubmit={handleCreate}>
                <span className={styles.fieldLabel}>新しいAPIキーを保存</span>
                <input
                    className={styles.input}
                    placeholder="APIキー名"
                    value={name}
                    onChange={(event: ChangeEvent<HTMLInputElement>) => setName(event.target.value)}
                />
                <select
                    className={styles.select}
                    value={providerOverride}
                    onChange={(event: ChangeEvent<HTMLSelectElement>) => setProviderOverride(event.target.value)}
                >
                    {LLM_PROVIDER_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                            {option.charAt(0).toUpperCase() + option.slice(1)}
                        </option>
                    ))}
                </select>
                <textarea
                    className={styles.textarea}
                    placeholder="APIキーを貼り付けてください"
                    value={keyValue}
                    rows={3}
                    onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setKeyValue(event.target.value)}
                />
                <button className={styles.primaryButton} type="submit" disabled={isSaving}>
                    {isSaving ? '保存中…' : 'APIキーを保存'}
                </button>
            </form>

            {feedback && <p className={styles.successText}>{feedback}</p>}
            {error && <p className={styles.errorText}>{error}</p>}

            {apiKeys.length > 0 && (
                <ul className={styles.apiKeyList}>
                    {apiKeys.map((key) => (
                        <li key={key.id} className={styles.apiKeyListItem}>
                            <div>
                                <strong>{key.name}</strong>
                                <span>{key.maskedKey}</span>
                                <span className={styles.apiKeyMeta}>{new Date(key.updatedAt).toLocaleString()}</span>
                            </div>
                            <button
                                type="button"
                                className={styles.dangerButton}
                                onClick={() => handleDelete(key.id)}
                                disabled={deletingId === key.id}
                            >
                                {deletingId === key.id ? '削除中…' : '削除'}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default WorkflowInspector;