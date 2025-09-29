import React from 'react';
import { render, screen } from '@testing-library/react';
import WorkflowInspector from '../../src/client/components/WorkflowInspector/WorkflowInspector';
import { LLMApiKeySummary } from '../../src/shared/types/ai';

const noop = (..._args: any[]) => undefined;
const resolvedSummary: LLMApiKeySummary = {
    id: 'sample',
    name: 'sample-key',
    provider: 'openai',
    maskedKey: '****abcd',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
};

describe('WorkflowInspector', () => {
    it('renders placeholder when no node is selected', () => {
        render(
            <WorkflowInspector
                selectedNode={undefined}
                onUpdateNode={noop}
                onDeleteNode={noop}
                runStatus={null}
                savedWorkflows={[]}
                onLoadWorkflow={noop}
                apiKeys={[]}
                onCreateApiKey={async () => resolvedSummary}
                onDeleteApiKey={async () => undefined}
            />
        );

        expect(screen.getByText('ノード設定')).toBeInTheDocument();
        expect(screen.getByText('編集するノードをキャンバス上で選択してください。')).toBeInTheDocument();
    });

    it('shows API key selector label', () => {
        render(
            <WorkflowInspector
                selectedNode={undefined}
                onUpdateNode={noop}
                onDeleteNode={noop}
                runStatus={null}
                savedWorkflows={[]}
                onLoadWorkflow={noop}
                apiKeys={[resolvedSummary]}
                onCreateApiKey={async () => resolvedSummary}
                onDeleteApiKey={async () => undefined}
            />
        );

        expect(screen.getByText('保存済みAPIキー')).toBeInTheDocument();
    });
});