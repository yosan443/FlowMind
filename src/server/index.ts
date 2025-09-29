import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { createWorkflowRouter } from './api/routes/workflowRoutes';
import { WorkflowController } from './api/controllers/workflowController';
import { WorkflowService } from './services/workflows/builderService';
import { WorkflowRunManager } from './workflow/runManager';
import { ApiKeyService } from './services/ai/apiKeyService';
import { ApiKeyController } from './api/controllers/apiKeyController';
import { createApiKeyRouter } from './api/routes/apiKeyRoutes';
import { UserRepository } from './repositories/userRepository';
import { AuthService } from './services/auth/authService';
import { AuthController } from './api/controllers/authController';
import { createAuthRouter } from './api/routes/authRoutes';
import { createAuthMiddleware } from './api/middleware/authMiddleware';

const app = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
    },
});

const userRepository = new UserRepository();
const authService = new AuthService(userRepository);
const authController = new AuthController(authService);
const workflowService = new WorkflowService();
const apiKeyService = new ApiKeyService();
const authMiddleware = createAuthMiddleware(authService);
const runManager = new WorkflowRunManager(io, async (ref: string) => {
    const key = await apiKeyService.resolveKeyValue(ref);
    return key;
});
const workflowController = new WorkflowController(runManager, workflowService);
const apiKeyController = new ApiKeyController(apiKeyService);

app.use(cors());
app.use(express.json());

app.use('/api/workflows', createWorkflowRouter(workflowController));
app.use('/api/api-keys', authMiddleware, createApiKeyRouter(apiKeyController));
app.use('/api/auth', createAuthRouter(authController, authMiddleware));

io.on('connection', () => {
    console.log('Client connected to workflow event stream.');
});

const PORT = Number(process.env.PORT ?? 5000);

httpServer.listen(PORT, () => {
    console.log(`FlowMind server is running on http://localhost:${PORT}`);
});