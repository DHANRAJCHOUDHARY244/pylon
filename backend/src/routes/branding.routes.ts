import { Router } from 'express';

import { brandingController } from '../controllers/branding.controller.js';
import { authenticate, requireAdmin, validate } from '../middleware/index.js';
import { updateBrandingSchema } from '../validators/branding.validator.js';

const router = Router();

router.get('/public', brandingController.getPublic);
router.put(
  '/',
  authenticate,
  requireAdmin,
  validate(updateBrandingSchema),
  brandingController.update,
);

export default router;
