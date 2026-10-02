import { Router } from 'express';

import { taxonomyController } from '../controllers/taxonomy.controller.js';
import { authenticate, validate } from '../middleware/index.js';
import {
  updateBrandSchema,
  updateCategorySchema,
  upsertBrandSchema,
  upsertCategorySchema,
} from '../validators/taxonomy.validator.js';

const router = Router();

router.use(authenticate);

router.post('/sync', taxonomyController.sync);

router.get('/brands', taxonomyController.listBrands);
router.post('/brands', validate(upsertBrandSchema), taxonomyController.createBrand);
router.patch('/brands/:slug', validate(updateBrandSchema), taxonomyController.updateBrand);
router.delete('/brands/:slug', taxonomyController.removeBrand);

router.get('/categories', taxonomyController.listCategories);
router.post('/categories', validate(upsertCategorySchema), taxonomyController.createCategory);
router.patch('/categories/:slug', validate(updateCategorySchema), taxonomyController.updateCategory);
router.delete('/categories/:slug', taxonomyController.removeCategory);

export default router;
