import React, { useCallback, useRef } from 'react';
import ReactFlow, {
    Background,
    Controls,
    MiniMap,
    Connection,
    EdgeChange,
    NodeChange,
    ReactFlowProvider,
    useReactFlow,
    MarkerType,
    Handle,
    Position,
    NodeProps,
} from 'react-flow-renderer';
import { FlowEdge, FlowNode, FlowNodeData } from '@/client/utils/workflowMapper';
import { WorkflowNodeType } from '../../../shared/types/workflows';
import styles from './Canvas.module.css';

interface CanvasProps {
    nodes: FlowNode[];
    edges: FlowEdge[];
    onNodesChange: (changes: NodeChange[]) => void;
    onEdgesChange: (changes: EdgeChange[]) => void;
    onConnect: (connection: Connection) => void;
    onNodeSelect: (nodeId: string | null) => void;
    onCreateNode: (type: WorkflowNodeType, position: { x: number; y: number }) => void;
}

const FlowMindNode: React.FC<NodeProps<FlowNodeData>> = ({ data }) => {
    const isSourceDisabled = data.nodeType === 'output';
    const isTargetDisabled = data.nodeType === 'input' || data.nodeType === 'memoryRead';

    return (
        <div className={`${styles.node} ${styles[data.status]}`}>
            {!isTargetDisabled && <Handle type="target" position={Position.Left} />}
            <div className={styles.nodeContent}>
                <span className={styles.nodeType}>{data.nodeType}</span>
                <h4 className={styles.nodeLabel}>{data.label}</h4>
                {data.outputPreview && <p className={styles.nodePreview}>{data.outputPreview}</p>}
                {data.message && <p className={styles.nodeMessage}>{data.message}</p>}
            </div>
            {!isSourceDisabled && <Handle type="source" position={Position.Right} />}
        </div>
    );
};

const InnerCanvas: React.FC<CanvasProps> = ({ nodes, edges, onNodesChange, onEdgesChange, onConnect, onNodeSelect, onCreateNode }) => {
    const reactFlowWrapper = useRef<HTMLDivElement | null>(null);
    const reactFlow = useReactFlow();

    const handleDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const handleDrop = useCallback(
        (event: React.DragEvent) => {
            event.preventDefault();
            const nodeType = event.dataTransfer.getData('application/flowmind-node') as WorkflowNodeType;
            if (!nodeType || !reactFlowWrapper.current) {
                return;
            }

            const bounds = reactFlowWrapper.current.getBoundingClientRect();
            const position = reactFlow.project({
                x: event.clientX - bounds.left,
                y: event.clientY - bounds.top,
            });

            onCreateNode(nodeType, position);
        },
        [onCreateNode, reactFlow]
    );

    const handleSelectionChange = useCallback(
        (params: unknown) => {
            const selection = params as { nodes?: FlowNode[] };
            const selectedNodes = selection.nodes ?? [];

            if (selectedNodes.length > 0) {
                onNodeSelect(selectedNodes[0].id);
            } else {
                onNodeSelect(null);
            }
        },
        [onNodeSelect]
    );

    return (
        <div className={styles.canvas} ref={reactFlowWrapper} onDragOver={handleDragOver} onDrop={handleDrop}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onSelectionChange={handleSelectionChange}
                fitView
                nodeTypes={{ flowmindNode: FlowMindNode as unknown as React.FC<NodeProps> }}
                defaultEdgeOptions={{ markerEnd: { type: MarkerType.ArrowClosed } }}
            >
                <MiniMap className={styles.miniMap} />
                <Controls className={styles.controls} />
                <Background gap={16} />
            </ReactFlow>
        </div>
    );
};

const Canvas: React.FC<CanvasProps> = (props) => (
    <ReactFlowProvider>
        <InnerCanvas {...props} />
    </ReactFlowProvider>
);

export default Canvas;