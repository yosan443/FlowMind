import { Router } from 'express';
import type { RequestHandler } from 'express-serve-static-core';
import { AuthController } from '../controllers/authController';

export function createAuthRouter(controller: AuthController, authGuard?: RequestHandler): Router {
    const router = Router();

    router.get('/config', controller.config);
    router.post('/register/email', controller.registerWithEmail);
    router.post('/login/email', controller.loginWithEmail);
    router.post('/login/google', controller.loginWithGoogle);
    if (authGuard) {
        router.get('/me', authGuard, controller.me);
    } else {
        router.get('/me', controller.me);
    }

    return router;
}
