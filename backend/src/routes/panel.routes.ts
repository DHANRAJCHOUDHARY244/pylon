import { Router } from 'express';

import { panelController } from '../controllers/panel.controller.js';
import { authenticate, validate } from '../middleware/index.js';
import { updatePanelSchema, upsertPanelSchema } from '../validators/equipment.validator.js';

const router = Router();

router.use(authenticate);

router.get('/', panelController.list);
router.get('/brands', panelController.brands);
router.get('/by-skus', panelController.getMany);
router.get('/:sku', panelController.getBySku);

router.post('/', validate(upsertPanelSchema), panelController.create);
router.patch('/:sku', validate(updatePanelSchema), panelController.update);
router.delete('/:sku', panelController.remove);

export default router;
