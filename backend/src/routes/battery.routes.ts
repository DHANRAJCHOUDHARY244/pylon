import { Router } from 'express';

import { batteryController } from '../controllers/battery.controller.js';
import { authenticate } from '../middleware/index.js';

const router = Router();

router.use(authenticate);

router.get('/', batteryController.list);
router.get('/brands', batteryController.brands);
router.get('/by-skus', batteryController.getMany);
router.get('/:sku', batteryController.getBySku);

export default router;
