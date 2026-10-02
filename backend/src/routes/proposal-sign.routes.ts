import { Router } from 'express';

import { proposalSignController } from '../controllers/proposal-sign.controller.js';
import { quoteChatController } from '../controllers/quote-chat.controller.js';
import { authenticate } from '../middleware/index.js';

const router = Router();

/** Public customer signing endpoints (no auth). */
router.get('/public/:token', proposalSignController.getPublic);
router.post('/public/:token', proposalSignController.advance);
router.get('/public/:token/chat', quoteChatController.listPublic);
router.post('/public/:token/chat', quoteChatController.postPublic);

/** Authenticated project signing link management. */
router.use(authenticate);
router.get('/chats', quoteChatController.listThreads);
router.post('/chats/:projectId/read', quoteChatController.markRead);
router.get('/project/:projectId', proposalSignController.list);
router.post('/project/:projectId', proposalSignController.create);
router.get('/project/:projectId/chat', quoteChatController.listProject);
router.post('/project/:projectId/chat', quoteChatController.postProject);

export default router;
