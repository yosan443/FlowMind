import { type Request, type Response } from 'express';
import { ApiKeyService } from '../../services/ai/apiKeyService';
import { validateCreateApiKey, validateUpdateApiKey } from '../validators/apiKeyValidator';
import { CreateLLMApiKeyRequest, UpdateLLMApiKeyRequest } from '../../../shared/types/ai';
import { type AuthenticatedRequest } from '../middleware/authMiddleware';

export class ApiKeyController {
    constructor(private readonly apiKeyService: ApiKeyService) {}

    private requireUser(req: Request, res: Response) {
        const { user } = req as AuthenticatedRequest;
        if (!user) {
            res.status(401).json({ message: '認証情報が必要です。' });
            return null;
        }
        return user;
    }

    public list = async (req: Request, res: Response) => {
        const user = this.requireUser(req, res);
        if (!user) {
            return;
        }
        const keys = await this.apiKeyService.listKeys(user.id);
        return res.status(200).json(keys);
    };

    public get = async (req: Request, res: Response) => {
        const user = this.requireUser(req, res);
        if (!user) {
            return;
        }
        const summary = await this.apiKeyService.getSummary(req.params.id, user.id);
        if (!summary) {
            return res.status(404).json({ message: 'APIキーが見つかりません。' });
        }
        return res.status(200).json(summary);
    };

    public create = async (req: Request, res: Response) => {
        const user = this.requireUser(req, res);
        if (!user) {
            return;
        }
        const payload = req.body as Partial<CreateLLMApiKeyRequest>;
        const errors = validateCreateApiKey(payload);
        if (errors.length > 0) {
            return res.status(400).json({ message: 'APIキーの保存に失敗しました。', errors });
        }

        const created = await this.apiKeyService.createKey(user.id, payload as CreateLLMApiKeyRequest);
        return res.status(201).json(created);
    };

    public update = async (req: Request, res: Response) => {
        const user = this.requireUser(req, res);
        if (!user) {
            return;
        }
        const updates = req.body as UpdateLLMApiKeyRequest;
        const errors = validateUpdateApiKey(updates);
        if (errors.length > 0) {
            return res.status(400).json({ message: 'APIキーの更新に失敗しました。', errors });
        }

        const updated = await this.apiKeyService.updateKey(req.params.id, user.id, updates);
        if (!updated) {
            return res.status(404).json({ message: 'APIキーが見つかりません。' });
        }
        return res.status(200).json(updated);
    };

    public delete = async (req: Request, res: Response) => {
        const user = this.requireUser(req, res);
        if (!user) {
            return;
        }
        const removed = await this.apiKeyService.deleteKey(req.params.id, user.id);
        if (!removed) {
            return res.status(404).json({ message: 'APIキーが見つかりません。' });
        }
        return res.status(204).send();
    };
}
