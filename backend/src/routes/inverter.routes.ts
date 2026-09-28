import { Router } from 'express';

import { inverterController } from '../controllers/inverter.controller.js';
import { authenticate } from '../middleware/index.js';

const router = Router();

router.use(authenticate);

router.get('/', inverterController.list);
router.get('/brands', inverterController.brands);
router.get('/by-skus', inverterController.getMany);
router.get('/:sku', inverterController.getBySku);

export default router;
