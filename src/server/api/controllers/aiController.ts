import { Request, Response } from 'express';

export const generateWorkflow = async (_req: Request, res: Response) => {
    res.status(501).json({ message: 'LLM workflow generation is not yet implemented.' });
};

export const analyzeData = async (_req: Request, res: Response) => {
    res.status(501).json({ message: 'Vision analysis is not yet implemented.' });
};

export const aiController = {
    generateWorkflow,
    analyzeData,
};