import { Router, Request, Response } from 'express';

const router = Router();

router.post('/generate', (_req: Request, res: Response) => {
	res.status(501).json({ message: 'AI generation endpoint is not implemented yet.' });
});

router.post('/analyze', (_req: Request, res: Response) => {
	res.status(501).json({ message: 'AI analysis endpoint is not implemented yet.' });
});

export default router;