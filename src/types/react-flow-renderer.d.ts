declare module 'react-flow-renderer' {
    import * as React from 'react';

    export interface XYPosition {
        x: number;
        y: number;
    }

    export interface Node<Data = unknown> {
        id: string;
        type?: string;
        position: XYPosition;
        data: Data;
        width?: number;
        height?: number;
        draggable?: boolean;
        selectable?: boolean;
        sourcePosition?: Position;
        targetPosition?: Position;
    }

    export interface Edge {
        id: string;
        source: string;
        target: string;
        sourceHandle?: string;
        targetHandle?: string;
        markerEnd?: { type: MarkerType };
    }

    export type NodeChange = unknown;
    export type EdgeChange = unknown;

    export interface Connection {
        source: string | null;
        target: string | null;
        sourceHandle?: string | null;
        targetHandle?: string | null;
    }

    export interface NodeProps<Data = unknown> {
        data: Data;
    }

    export enum MarkerType {
        ArrowClosed = 'arrowclosed',
    }

    export enum Position {
        Left = 'left',
        Right = 'right',
        Top = 'top',
        Bottom = 'bottom',
    }

    export const MiniMap: React.FC<{ className?: string }>;
    export const Controls: React.FC<{ className?: string }>;
    export const Background: React.FC<{ gap?: number }>;
    export const Handle: React.FC<{ type: 'source' | 'target'; position: Position }>;
    export const ReactFlowProvider: React.FC<{ children: React.ReactNode }>;

    export function useReactFlow(): {
        project(position: XYPosition): XYPosition;
    };

    export function applyNodeChanges<Data = unknown>(changes: NodeChange[], nodes: Node<Data>[]): Node<Data>[];
    export function applyEdgeChanges(changes: EdgeChange[], edges: Edge[]): Edge[];
    export function addEdge(connection: Connection, edges: Edge[]): Edge[];

    export interface SelectionChangeParams<Data = unknown> {
        nodes: Node<Data>[];
        edges: Edge[];
    }

    export interface ReactFlowProps<Data = unknown> {
        nodes: Node<Data>[];
        edges: Edge[];
        onNodesChange?: (changes: NodeChange[]) => void;
        onEdgesChange?: (changes: EdgeChange[]) => void;
        onConnect?: (connection: Connection) => void;
        nodeTypes?: Record<string, React.FC<NodeProps<Data>>>;
        onSelectionChange?: (params: SelectionChangeParams<Data>) => void;
        fitView?: boolean;
        defaultEdgeOptions?: {
            markerEnd?: {
                type: MarkerType;
            };
        };
    }

    const ReactFlow: React.FC<ReactFlowProps>;

    export default ReactFlow;
}
