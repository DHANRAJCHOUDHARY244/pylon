import { Router } from 'express';

import healthRoutes from './health.routes.js';
import brandingRoutes from './branding.routes.js';
import crmRoutes from './crm.routes.js';
import projectRoutes from './project.routes.js';
import userRoutes from './user.routes.js';

const router = Router();

router.use('/health', healthRoutes);
router.use('/users', userRoutes);
router.use('/branding', brandingRoutes);
router.use('/projects', projectRoutes);
router.use('/crm', crmRoutes);

export default router;
