import { Router } from 'express';

import { batteryController } from '../controllers/battery.controller.js';

const router = Router();

/** Published battery catalog is readable without auth (design sketch / string editor). */
router.get('/', batteryController.list);
router.get('/brands', batteryController.brands);
router.get('/by-skus', batteryController.getMany);
router.get('/:sku', batteryController.getBySku);

export default router;
