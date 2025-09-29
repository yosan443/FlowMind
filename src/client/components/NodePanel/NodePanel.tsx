import React, { DragEvent } from 'react';
import { WorkflowNodeType } from '../../../shared/types/workflows';
import styles from './NodePanel.module.css';

const PALETTE: Array<{ type: WorkflowNodeType; label: string; description: string }> = [
    { type: 'input', label: '入力', description: 'ユーザー入力や初期データの開始地点です。' },
    { type: 'llm', label: 'LLM', description: 'プロンプトを設定して大規模言語モデルを呼び出します。' },
    { type: 'command', label: 'コマンド', description: 'シェルコマンドやスクリプトを非同期に実行します。' },
    { type: 'memoryWrite', label: 'メモリ書き込み', description: '共有メモリにデータを保存します。' },
    { type: 'memoryRead', label: 'メモリ読み取り', description: '共有メモリから値を取り出します。' },
    { type: 'output', label: '出力', description: 'ワークフローの最終結果を表示します。' },
];

const NodePanel: React.FC = () => {
    const handleDragStart = (event: DragEvent<HTMLDivElement>, type: WorkflowNodeType) => {
        event.dataTransfer.setData('application/flowmind-node', type);
        event.dataTransfer.effectAllowed = 'move';
    };

    return (
        <aside className={styles.nodePanel}>
            <h2 className={styles.heading}>ノードパレット</h2>
            <p className={styles.subheading}>キャンバスにドラッグしてワークフローを構築しましょう。</p>
            <div className={styles.nodeList}>
                {PALETTE.map((node) => (
                    <div
                        key={node.type}
                        className={styles.nodeItem}
                        draggable
                        onDragStart={(event: DragEvent<HTMLDivElement>) => handleDragStart(event, node.type)}
                    >
                        <span className={styles.nodeLabel}>{node.label}</span>
                        <p className={styles.nodeDescription}>{node.description}</p>
                    </div>
                ))}
            </div>
        </aside>
    );
};

export default NodePanel;