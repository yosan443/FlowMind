import { access, mkdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { WorkflowDefinition, WorkflowPersistenceRecord } from '../../../shared/types/workflows';

const DATA_DIRECTORY = join(process.cwd(), 'data');
const STORAGE_PATH = join(DATA_DIRECTORY, 'workflows.json');

async function ensureStorageFile(): Promise<void> {
    try {
        await access(STORAGE_PATH);
    } catch (error) {
        await mkdir(DATA_DIRECTORY, { recursive: true });
        const initialPayload: WorkflowPersistenceRecord = {
            workflows: [],
            updatedAt: new Date().toISOString(),
        };
        await writeFile(STORAGE_PATH, JSON.stringify(initialPayload, null, 2), 'utf-8');
    }
}

async function readStorage(): Promise<WorkflowPersistenceRecord> {
    await ensureStorageFile();
    const raw = await readFile(STORAGE_PATH, 'utf-8');
    return JSON.parse(raw) as WorkflowPersistenceRecord;
}

async function writeStorage(record: WorkflowPersistenceRecord): Promise<void> {
    await ensureStorageFile();
    const payload = { ...record, updatedAt: new Date().toISOString() };
    await writeFile(STORAGE_PATH, JSON.stringify(payload, null, 2), 'utf-8');
}

export class WorkflowService {
    public async listWorkflows(): Promise<WorkflowDefinition[]> {
        const record = await readStorage();
        return record.workflows;
    }

    public async getWorkflow(id: string): Promise<WorkflowDefinition | undefined> {
        const record = await readStorage();
        return record.workflows.find((workflow) => workflow.id === id);
    }

    public async saveWorkflow(input: WorkflowDefinition): Promise<WorkflowDefinition> {
        const record = await readStorage();
        const existingIndex = record.workflows.findIndex((wf) => wf.id === input.id);
        const timestamp = new Date().toISOString();
        const workflow: WorkflowDefinition = {
            ...input,
            createdAt: existingIndex === -1 ? timestamp : input.createdAt,
            updatedAt: timestamp,
        };

        if (existingIndex === -1) {
            record.workflows.push(workflow);
        } else {
            record.workflows[existingIndex] = workflow;
        }

        await writeStorage(record);
        return workflow;
    }

    public async deleteWorkflow(id: string): Promise<boolean> {
        const record = await readStorage();
        const nextWorkflows = record.workflows.filter((workflow) => workflow.id !== id);
        if (nextWorkflows.length === record.workflows.length) {
            return false;
        }
        record.workflows = nextWorkflows;
        await writeStorage(record);
        return true;
    }
}