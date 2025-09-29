import { WorkflowEdge, WorkflowNode } from '../../shared/types/workflows';

export class WorkflowTopologyError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'WorkflowTopologyError';
    }
}

export function topologicalSort(nodes: WorkflowNode[], edges: WorkflowEdge[]): string[] {
    const nodeIds = new Set(nodes.map((node) => node.id));
    const adjacency = new Map<string, Set<string>>();
    const indegree = new Map<string, number>();

    for (const node of nodes) {
        adjacency.set(node.id, new Set());
        indegree.set(node.id, 0);
    }

    for (const edge of edges) {
        if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
            throw new WorkflowTopologyError(`Edge references unknown node: ${edge.source} -> ${edge.target}`);
        }
        adjacency.get(edge.source)?.add(edge.target);
        indegree.set(edge.target, (indegree.get(edge.target) ?? 0) + 1);
    }

    const queue: string[] = [];
    for (const [nodeId, degree] of indegree.entries()) {
        if (degree === 0) {
            queue.push(nodeId);
        }
    }

    const sorted: string[] = [];
    while (queue.length > 0) {
        const nodeId = queue.shift()!;
        sorted.push(nodeId);
        for (const neighbor of adjacency.get(nodeId) ?? []) {
            const nextDegree = (indegree.get(neighbor) ?? 0) - 1;
            indegree.set(neighbor, nextDegree);
            if (nextDegree === 0) {
                queue.push(neighbor);
            }
        }
    }

    if (sorted.length !== nodes.length) {
        throw new WorkflowTopologyError('Workflow contains cycles or disconnected components.');
    }

    return sorted;
}
