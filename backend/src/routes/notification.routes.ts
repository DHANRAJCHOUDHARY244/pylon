import { Router } from 'express';

import { notificationController } from '../controllers/notification.controller.js';
import { authenticate } from '../middleware/index.js';

const router = Router();

router.use(authenticate);
router.get('/', notificationController.list);
router.post('/read-all', notificationController.markAllRead);
router.post('/:notificationId/read', notificationController.markRead);

export default router;
