import { Router } from 'express';
import { WorkflowController } from '../controllers/workflowController';

export function createWorkflowRouter(controller: WorkflowController): Router {
	const router = Router();

	router.post('/run', controller.runWorkflow);
	router.post('/run/:runId/stop', controller.cancelRun);
	router.get('/run/:runId/status', controller.getRunStatus);

	router.get('/', controller.listWorkflows);
	router.get('/:id', controller.getWorkflow);
	router.post('/', controller.saveWorkflow);
	router.delete('/:id', controller.deleteWorkflow);

	return router;
}