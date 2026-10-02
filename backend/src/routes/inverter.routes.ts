import { Router } from 'express';

import { inverterController } from '../controllers/inverter.controller.js';
import { authenticate, validate } from '../middleware/index.js';
import { updateInverterSchema, upsertInverterSchema } from '../validators/equipment.validator.js';

const router = Router();

/** Published inverter catalog is readable without auth (design sketch / string editor). */
router.get('/', inverterController.list);
router.get('/brands', inverterController.brands);
router.get('/by-skus', inverterController.getMany);
router.get('/:sku', inverterController.getBySku);

router.post('/', authenticate, validate(upsertInverterSchema), inverterController.create);
router.patch('/:sku', authenticate, validate(updateInverterSchema), inverterController.update);
router.delete('/:sku', authenticate, inverterController.remove);

export default router;
