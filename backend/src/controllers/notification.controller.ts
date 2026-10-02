import type { Response } from 'express';

import { BaseController } from '../base/base.controller.js';
import { MESSAGES } from '../constants/index.js';
import { notificationService } from '../services/notification.service.js';
import type { AuthenticatedRequest } from '../types/index.js';
import { asyncHandler } from '../utils/async-handler.js';

export class NotificationController extends BaseController {
  list = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const unreadOnly = String(req.query.unreadOnly ?? '') === '1';
    const result = await notificationService.listForUser(req.user!.id, {
      unreadOnly,
      limit: Number(req.query.limit ?? 40),
    });
    return this.ok(res, result);
  });

  markRead = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const result = await notificationService.markRead(
      req.user!.id,
      String(req.params.notificationId),
    );
    return this.ok(res, result, MESSAGES.UPDATED);
  });

  markAllRead = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const result = await notificationService.markAllRead(req.user!.id);
    return this.ok(res, result, MESSAGES.UPDATED);
  });
}

export const notificationController = new NotificationController();
