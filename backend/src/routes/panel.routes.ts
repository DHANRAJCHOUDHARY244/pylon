import { Router } from 'express';

import { panelController } from '../controllers/panel.controller.js';
import { authenticate } from '../middleware/index.js';

const router = Router();

router.use(authenticate);

router.get('/', panelController.list);
router.get('/brands', panelController.brands);
router.get('/by-skus', panelController.getMany);
router.get('/:sku', panelController.getBySku);

export default router;
