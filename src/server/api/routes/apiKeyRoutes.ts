import { Router } from 'express';
import { ApiKeyController } from '../controllers/apiKeyController';

export function createApiKeyRouter(controller: ApiKeyController): Router {
    const router = Router();

    router.get('/', controller.list);
    router.get('/:id', controller.get);
    router.post('/', controller.create);
    router.put('/:id', controller.update);
    router.delete('/:id', controller.delete);

    return router;
}
