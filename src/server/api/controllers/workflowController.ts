import { Request, Response } from 'express';
import { WorkflowRunManager } from '../../workflow/runManager';
import { WorkflowService } from '../../services/workflows/builderService';
import { validateWorkflowDefinition } from '../validators/workflowValidator';
import { WorkflowDefinition, WorkflowRunRequest } from '../../../shared/types/workflows';

export class WorkflowController {
    constructor(private readonly runManager: WorkflowRunManager, private readonly workflowService: WorkflowService) {}

    public runWorkflow = async (req: Request, res: Response) => {
        const payload = req.body as WorkflowRunRequest;
        if (!payload?.workflow) {
            return res.status(400).json({ message: 'ワークフローのペイロードが必要です。' });
        }

        const errors = validateWorkflowDefinition(payload.workflow);
        if (errors.length > 0) {
            return res.status(400).json({ message: 'ワークフローの検証に失敗しました', errors });
        }

        const { runId } = this.runManager.startRun(payload);
        return res.status(202).json({ runId });
    };

    public cancelRun = (req: Request, res: Response) => {
        const { runId } = req.params;
        if (!runId) {
            return res.status(400).json({ message: 'runId パラメーターは必須です。' });
        }

        const cancelled = this.runManager.cancelRun(runId);
        if (!cancelled) {
            return res.status(404).json({ message: '実行中のワークフローが見つかりません。' });
        }

        return res.status(200).json({ message: '実行の停止を要求しました。' });
    };

    public getRunStatus = (req: Request, res: Response) => {
        const { runId } = req.params;
        const status = this.runManager.getRunStatus(runId);
        if (!status) {
            return res.status(404).json({ message: '実行が見つかりません。' });
        }
        return res.status(200).json(status);
    };

    public listWorkflows = async (_req: Request, res: Response) => {
        const workflows = await this.workflowService.listWorkflows();
        return res.status(200).json(workflows);
    };

    public getWorkflow = async (req: Request, res: Response) => {
        const { id } = req.params;
        const workflow = await this.workflowService.getWorkflow(id);
        if (!workflow) {
            return res.status(404).json({ message: 'ワークフローが見つかりません。' });
        }
        return res.status(200).json(workflow);
    };

    public saveWorkflow = async (req: Request, res: Response) => {
        const workflow = req.body as WorkflowDefinition;
        const errors = validateWorkflowDefinition(workflow);
        if (errors.length > 0) {
            return res.status(400).json({ message: 'ワークフローの検証に失敗しました', errors });
        }

        const saved = await this.workflowService.saveWorkflow(workflow);
        return res.status(200).json(saved);
    };

    public deleteWorkflow = async (req: Request, res: Response) => {
        const { id } = req.params;
        const deleted = await this.workflowService.deleteWorkflow(id);
        if (!deleted) {
            return res.status(404).json({ message: 'ワークフローが見つかりません。' });
        }
        return res.status(204).send();
    };
}