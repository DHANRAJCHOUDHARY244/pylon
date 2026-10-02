import { Router } from 'express';

import healthRoutes from './health.routes.js';
import brandingRoutes from './branding.routes.js';
import batteryRoutes from './battery.routes.js';
import crmRoutes from './crm.routes.js';
import inverterRoutes from './inverter.routes.js';
import mediaRoutes from './media.routes.js';
import notificationRoutes from './notification.routes.js';
import panelRoutes from './panel.routes.js';
import projectRoutes from './project.routes.js';
import proposalSignRoutes from './proposal-sign.routes.js';
import taxonomyRoutes from './taxonomy.routes.js';
import userRoutes from './user.routes.js';

const router = Router();

router.use('/health', healthRoutes);
router.use('/users', userRoutes);
router.use('/branding', brandingRoutes);
router.use('/projects', projectRoutes);
router.use('/crm', crmRoutes);
router.use('/panels', panelRoutes);
router.use('/batteries', batteryRoutes);
router.use('/inverters', inverterRoutes);
router.use('/media', mediaRoutes);
router.use('/taxonomy', taxonomyRoutes);
router.use('/notifications', notificationRoutes);
router.use('/sign', proposalSignRoutes);

export default router;
