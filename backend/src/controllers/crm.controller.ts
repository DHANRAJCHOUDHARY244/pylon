import type { Response } from 'express';

import { BaseController } from '../base/base.controller.js';
import { MESSAGES } from '../constants/index.js';
import { omitUndefined } from '../helpers/object.js';
import { calendarOAuthService } from '../services/calendar-oauth.service.js';
import { crmService } from '../services/crm.service.js';
import type { AuthenticatedRequest } from '../types/index.js';
import { asyncHandler } from '../utils/async-handler.js';

function queryString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

export class CrmController extends BaseController {
  /* Leads */
  listLeads = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const result = await crmService.listLeads(
      req.user!.id,
      omitUndefined({
        page: Number(req.query.page ?? 1),
        limit: Number(req.query.limit ?? 20),
        q: queryString(req.query.q),
        status: queryString(req.query.status),
      }),
    );
    return this.ok(res, result);
  });

  createLead = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    return this.created(res, await crmService.createLead(req.user!.id, req.body), MESSAGES.CREATED);
  });

  updateLead = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    return this.ok(
      res,
      await crmService.updateLead(req.user!.id, String(req.params.id), req.body),
      MESSAGES.UPDATED,
    );
  });

  deleteLead = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    await crmService.deleteLead(req.user!.id, String(req.params.id));
    return this.ok(res, { id: req.params.id }, MESSAGES.DELETED);
  });

  getLead = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    return this.ok(res, await crmService.getLead(req.user!.id, String(req.params.id)));
  });

  convertLead = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    return this.created(
      res,
      await crmService.convertLead(req.user!.id, String(req.params.id), req.body),
      MESSAGES.CREATED,
    );
  });

  search = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    return this.ok(
      res,
      await crmService.searchWorkspace(req.user!.id, typeof req.query.q === 'string' ? req.query.q : ''),
    );
  });

  /* Deals */
  listDeals = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    return this.ok(
      res,
      await crmService.listDeals(
        req.user!.id,
        omitUndefined({
          q: queryString(req.query.q),
          stage: queryString(req.query.stage),
        }),
      ),
    );
  });

  createDeal = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    return this.created(res, await crmService.createDeal(req.user!.id, req.body), MESSAGES.CREATED);
  });

  syncQuote = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const result = await crmService.syncQuoteToCrm(req.user!.id, req.body);
    return result.created
      ? this.created(res, result, MESSAGES.CREATED)
      : this.ok(res, result, MESSAGES.UPDATED);
  });

  updateDeal = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    return this.ok(
      res,
      await crmService.updateDeal(req.user!.id, String(req.params.id), req.body),
      MESSAGES.UPDATED,
    );
  });

  deleteDeal = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    await crmService.deleteDeal(req.user!.id, String(req.params.id));
    return this.ok(res, { id: req.params.id }, MESSAGES.DELETED);
  });

  /* Contacts */
  listContacts = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    return this.ok(
      res,
      await crmService.listContacts(
        req.user!.id,
        omitUndefined({
          page: Number(req.query.page ?? 1),
          limit: Number(req.query.limit ?? 20),
          q: queryString(req.query.q),
        }),
      ),
    );
  });

  createContact = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    return this.created(res, await crmService.createContact(req.user!.id, req.body), MESSAGES.CREATED);
  });

  updateContact = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    return this.ok(
      res,
      await crmService.updateContact(req.user!.id, String(req.params.id), req.body),
      MESSAGES.UPDATED,
    );
  });

  deleteContact = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    await crmService.deleteContact(req.user!.id, String(req.params.id));
    return this.ok(res, { id: req.params.id }, MESSAGES.DELETED);
  });

  /* Tasks */
  listTasks = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    return this.ok(
      res,
      await crmService.listTasks(
        req.user!.id,
        omitUndefined({
          page: Number(req.query.page ?? 1),
          limit: Number(req.query.limit ?? 20),
          status: queryString(req.query.status),
        }),
      ),
    );
  });

  createTask = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    return this.created(res, await crmService.createTask(req.user!.id, req.body), MESSAGES.CREATED);
  });

  updateTask = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    return this.ok(
      res,
      await crmService.updateTask(req.user!.id, String(req.params.id), req.body),
      MESSAGES.UPDATED,
    );
  });

  deleteTask = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    await crmService.deleteTask(req.user!.id, String(req.params.id));
    return this.ok(res, { id: req.params.id }, MESSAGES.DELETED);
  });

  /* Calendar */
  listEvents = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    return this.ok(
      res,
      await crmService.listEvents(
        req.user!.id,
        omitUndefined({
          page: Number(req.query.page ?? 1),
          limit: Number(req.query.limit ?? 50),
          from: queryString(req.query.from),
          to: queryString(req.query.to),
        }),
      ),
    );
  });

  createEvent = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    return this.created(res, await crmService.createEvent(req.user!.id, req.body), MESSAGES.CREATED);
  });

  updateEvent = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    return this.ok(
      res,
      await crmService.updateEvent(req.user!.id, String(req.params.id), req.body),
      MESSAGES.UPDATED,
    );
  });

  deleteEvent = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    await crmService.deleteEvent(req.user!.id, String(req.params.id));
    return this.ok(res, { id: req.params.id }, MESSAGES.DELETED);
  });

  /* Calendar connections (Google / Outlook) */
  listCalendarConnections = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    return this.ok(res, await calendarOAuthService.listConnections(req.user!.id));
  });

  startCalendarOAuth = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    return this.ok(res, calendarOAuthService.getAuthUrl(req.user!.id, String(req.params.provider)));
  });

  syncCalendarProvider = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    return this.ok(res, await calendarOAuthService.syncProvider(req.user!.id, String(req.params.provider)));
  });

  disconnectCalendarProvider = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    return this.ok(
      res,
      await calendarOAuthService.disconnect(req.user!.id, String(req.params.provider)),
      MESSAGES.DELETED,
    );
  });

  calendarOAuthCallback = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const redirectTo = await calendarOAuthService.handleOAuthCallback(
      String(req.params.provider),
      typeof req.query.code === 'string' ? req.query.code : undefined,
      typeof req.query.state === 'string' ? req.query.state : undefined,
      typeof req.query.error === 'string' ? req.query.error : undefined,
    );
    return res.redirect(redirectTo);
  });

  /* Reporting */
  reporting = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    return this.ok(res, await crmService.reportingSummary(req.user!.id));
  });
}

export const crmController = new CrmController();
