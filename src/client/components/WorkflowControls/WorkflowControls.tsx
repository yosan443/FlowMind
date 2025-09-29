import React, { ChangeEvent } from 'react';
import styles from './WorkflowControls.module.css';

interface WorkflowControlsProps {
    workflowName: string;
    onNameChange: (value: string) => void;
    isRunning: boolean;
    onRun: () => void;
    onStop: () => void;
    onSave: () => void;
    userName?: string;
    onLogout?: () => void;
}

const WorkflowControls: React.FC<WorkflowControlsProps> = ({
    workflowName,
    onNameChange,
    isRunning,
    onRun,
    onStop,
    onSave,
    userName,
    onLogout,
}) => {
    return (
        <header className={styles.toolbar}>
            <div className={styles.titleGroup}>
                <h1>FlowMind</h1>
                <input
                    className={styles.nameInput}
                    value={workflowName}
                    onChange={(event: ChangeEvent<HTMLInputElement>) => onNameChange(event.target.value)}
                    placeholder="無題のワークフロー"
                />
            </div>
            <div className={styles.actions}>
                {userName && (
                    <div className={styles.userSection}>
                        <span className={styles.userBadge}>{userName}</span>
                        {onLogout && (
                            <button className={styles.logoutButton} type="button" onClick={onLogout}>
                                ログアウト
                            </button>
                        )}
                    </div>
                )}
                <button className={styles.saveButton} onClick={onSave}>
                    保存
                </button>
                {isRunning ? (
                    <button className={styles.stopButton} onClick={onStop}>
                        停止
                    </button>
                ) : (
                    <button className={styles.runButton} onClick={onRun}>
                        実行
                    </button>
                )}
            </div>
        </header>
    );
};

export default WorkflowControls;
