import { describe, it, expect } from 'vitest';
import { createWorkflow, getWorkflow, updateWorkflow, deleteWorkflow } from '../../src/server/services/workflows/builderService';

describe('Workflow Service', () => {
    it('should create a new workflow', async () => {
        const workflowData = { name: 'Test Workflow', nodes: [] };
        const result = await createWorkflow(workflowData);
        expect(result).toHaveProperty('id');
        expect(result.name).toBe(workflowData.name);
    });

    it('should retrieve a workflow by ID', async () => {
        const workflowId = 1; // Assuming a workflow with ID 1 exists
        const result = await getWorkflow(workflowId);
        expect(result).toHaveProperty('id', workflowId);
    });

    it('should update an existing workflow', async () => {
        const workflowId = 1; // Assuming a workflow with ID 1 exists
        const updatedData = { name: 'Updated Workflow' };
        const result = await updateWorkflow(workflowId, updatedData);
        expect(result).toHaveProperty('name', updatedData.name);
    });

    it('should delete a workflow', async () => {
        const workflowId = 1; // Assuming a workflow with ID 1 exists
        const result = await deleteWorkflow(workflowId);
        expect(result).toBe(true);
    });
});