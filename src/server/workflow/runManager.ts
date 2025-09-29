import { Server as SocketIOServer } from 'socket.io';
import { v4 as uuid } from 'uuid';
import {
    NodeStatusUpdate,
    WorkflowDefinition,
    WorkflowRunStatus,
    WorkflowRunRequest,
} from '../../shared/types/workflows';
import { WorkflowEngine, WorkflowEngineResult } from './engine';

interface ActiveRun {
    engine: WorkflowEngine;
    promise: Promise<WorkflowEngineResult>;
    workflowId: string;
}

export class WorkflowRunManager {
    private readonly activeRuns = new Map<string, ActiveRun>();
    private readonly runHistory = new Map<string, WorkflowRunStatus>();

    constructor(
        private readonly io: SocketIOServer,
        private readonly apiKeyProvider?: (ref: string) => Promise<string | undefined>
    ) {}

    public startRun(request: WorkflowRunRequest): { runId: string } {
        const runId = uuid();
        const engine = new WorkflowEngine({
            runId,
            workflow: request.workflow,
            initialInputs: request.inputOverrides,
            apiKeyProvider: this.apiKeyProvider,
        });

        engine.on('node', (update: NodeStatusUpdate) => {
            this.io.emit('workflow:node', { runId, update });
        });

        engine.on('workflow', (status: WorkflowRunStatus) => {
            this.runHistory.set(runId, status);
            this.io.emit('workflow:status', { runId, status });
            if (status.status === 'success' || status.status === 'error' || status.status === 'cancelled') {
                this.activeRuns.delete(runId);
            }
        });

        engine.on('log', (payload) => {
            this.io.emit('workflow:log', { runId, ...payload });
        });

        const promise = engine.run().catch((error) => {
            const status: WorkflowRunStatus = {
                runId,
                workflowId: request.workflow.id,
                status: 'error',
                startedAt: new Date().toISOString(),
                finishedAt: new Date().toISOString(),
                error: error instanceof Error ? error.message : String(error),
            };
            this.runHistory.set(runId, status);
            this.io.emit('workflow:status', { runId, status });
            this.activeRuns.delete(runId);
            throw error;
        });

        promise.catch(() => undefined);

        this.activeRuns.set(runId, { engine, promise, workflowId: request.workflow.id });
        return { runId };
    }

    public async awaitRun(runId: string): Promise<WorkflowEngineResult | undefined> {
        const active = this.activeRuns.get(runId);
        if (!active) {
            return undefined;
        }
        try {
            return await active.promise;
        } finally {
            this.activeRuns.delete(runId);
        }
    }

    public cancelRun(runId: string): boolean {
        const active = this.activeRuns.get(runId);
        if (!active) {
            return false;
        }
        active.engine.cancel();
        return true;
    }

    public getRunStatus(runId: string): WorkflowRunStatus | undefined {
        return this.runHistory.get(runId);
    }
}
