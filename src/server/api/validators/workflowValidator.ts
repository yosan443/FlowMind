import { WorkflowDefinition, WorkflowNodeType } from '../../../shared/types/workflows';

const ALLOWED_NODE_TYPES: WorkflowNodeType[] = ['input', 'output', 'llm', 'command', 'memoryRead', 'memoryWrite'];

export function validateWorkflowDefinition(workflow: WorkflowDefinition): string[] {
    const errors: string[] = [];

    if (!workflow) {
        return ['ワークフローのペイロードが必要です。'];
    }

    if (!workflow.id) {
        errors.push('ワークフロー ID は必須です。');
    }

    if (!workflow.name) {
        errors.push('ワークフロー名は必須です。');
    }

    if (!Array.isArray(workflow.nodes) || workflow.nodes.length === 0) {
        errors.push('ワークフローには少なくとも 1 つのノードが必要です。');
    }

    if (!Array.isArray(workflow.edges)) {
        errors.push('エッジは配列で指定してください。');
    }

    const nodeIds = new Set(workflow.nodes?.map((node) => node.id));

    for (const node of workflow.nodes ?? []) {
        if (!node.id) {
            errors.push('各ノードには ID が必要です。');
        }
        if (!ALLOWED_NODE_TYPES.includes(node.type)) {
            errors.push(`未対応のノード種類です: ${node.type}`);
        }
    }

    const hasInputNode = workflow.nodes?.some((node) => node.type === 'input');
    const hasOutputNode = workflow.nodes?.some((node) => node.type === 'output');

    if (!hasInputNode) {
        errors.push('ワークフローには入力ノードが少なくとも 1 つ必要です。');
    }

    if (!hasOutputNode) {
        errors.push('ワークフローには出力ノードが少なくとも 1 つ必要です。');
    }

    for (const edge of workflow.edges ?? []) {
        if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
            errors.push(`エッジが存在しないノードを参照しています: ${edge.source} → ${edge.target}`);
        }
    }

    return errors;
}
