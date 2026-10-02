import { Router } from 'express';

import { batteryController } from '../controllers/battery.controller.js';
import { authenticate, validate } from '../middleware/index.js';
import { updateBatterySchema, upsertBatterySchema } from '../validators/equipment.validator.js';

const router = Router();

/** Published battery catalog is readable without auth (design sketch / string editor). */
router.get('/', batteryController.list);
router.get('/brands', batteryController.brands);
router.get('/by-skus', batteryController.getMany);
router.get('/:sku', batteryController.getBySku);

router.post('/', authenticate, validate(upsertBatterySchema), batteryController.create);
router.patch('/:sku', authenticate, validate(updateBatterySchema), batteryController.update);
router.delete('/:sku', authenticate, batteryController.remove);

export default router;
