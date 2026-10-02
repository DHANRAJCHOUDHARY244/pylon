import { Router } from 'express';

import { inverterController } from '../controllers/inverter.controller.js';

const router = Router();

/** Published inverter catalog is readable without auth (design sketch / string editor). */
router.get('/', inverterController.list);
router.get('/brands', inverterController.brands);
router.get('/by-skus', inverterController.getMany);
router.get('/:sku', inverterController.getBySku);

export default router;
