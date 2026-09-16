import { Router } from 'express';

import { crmController } from '../controllers/crm.controller.js';
import { authenticate, validate } from '../middleware/index.js';
import {
  convertLeadSchema,
  createCalendarEventSchema,
  createContactSchema,
  createDealSchema,
  createLeadSchema,
  createTaskSchema,
  syncQuoteToCrmSchema,
  updateCalendarEventSchema,
  updateContactSchema,
  updateDealSchema,
  updateLeadSchema,
  updateTaskSchema,
} from '../validators/crm.validator.js';

const router = Router();

/* OAuth callbacks must be public (state carries signed user id). */
router.get('/calendar/oauth/:provider/callback', crmController.calendarOAuthCallback);

router.use(authenticate);

router.get('/reporting', crmController.reporting);
router.get('/search', crmController.search);

router.get('/leads', crmController.listLeads);
router.post('/leads', validate(createLeadSchema), crmController.createLead);
router.get('/leads/:id', crmController.getLead);
router.patch('/leads/:id', validate(updateLeadSchema), crmController.updateLead);
router.post('/leads/:id/convert', validate(convertLeadSchema), crmController.convertLead);
router.delete('/leads/:id', crmController.deleteLead);

router.get('/deals', crmController.listDeals);
router.post('/deals', validate(createDealSchema), crmController.createDeal);
router.post('/deals/sync-quote', validate(syncQuoteToCrmSchema), crmController.syncQuote);
router.patch('/deals/:id', validate(updateDealSchema), crmController.updateDeal);
router.delete('/deals/:id', crmController.deleteDeal);

router.get('/contacts', crmController.listContacts);
router.post('/contacts', validate(createContactSchema), crmController.createContact);
router.patch('/contacts/:id', validate(updateContactSchema), crmController.updateContact);
router.delete('/contacts/:id', crmController.deleteContact);

router.get('/tasks', crmController.listTasks);
router.post('/tasks', validate(createTaskSchema), crmController.createTask);
router.patch('/tasks/:id', validate(updateTaskSchema), crmController.updateTask);
router.delete('/tasks/:id', crmController.deleteTask);

router.get('/calendar/connections', crmController.listCalendarConnections);
router.get('/calendar/connections/:provider/start', crmController.startCalendarOAuth);
router.post('/calendar/connections/:provider/sync', crmController.syncCalendarProvider);
router.delete('/calendar/connections/:provider', crmController.disconnectCalendarProvider);

router.get('/calendar', crmController.listEvents);
router.post('/calendar', validate(createCalendarEventSchema), crmController.createEvent);
router.patch('/calendar/:id', validate(updateCalendarEventSchema), crmController.updateEvent);
router.delete('/calendar/:id', crmController.deleteEvent);

export default router;
