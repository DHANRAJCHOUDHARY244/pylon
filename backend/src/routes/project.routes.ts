import { Router } from 'express';

import { designController } from '../controllers/design.controller.js';
import { projectController } from '../controllers/project.controller.js';
import { authenticate, validate } from '../middleware/index.js';
import { createProjectSchema, saveDesignSchema, updateEquipmentSchema, updateSiteSchema } from '../validators/project.validator.js';

const router = Router();

router.use(authenticate);

router.get('/', projectController.list);
router.post('/', validate(createProjectSchema), projectController.create);
router.get('/:projectId', projectController.getById);
router.patch('/:projectId/site', validate(updateSiteSchema), projectController.updateSite);
router.patch('/:projectId/equipment', validate(updateEquipmentSchema), projectController.updateEquipment);

router.get('/:projectId/design', designController.getCurrent);
router.put('/:projectId/design', validate(saveDesignSchema), designController.saveCurrent);
router.get('/:projectId/design/versions', designController.listVersions);
router.post('/:projectId/design/versions/:designId/restore', designController.restoreVersion);

export default router;
