import type { Response } from 'express';

import { BaseController } from '../base/base.controller.js';
import { MESSAGES } from '../constants/index.js';
import { quoteChatService } from '../services/quote-chat.service.js';
import type { AuthenticatedRequest } from '../types/index.js';
import { asyncHandler } from '../utils/async-handler.js';

export class QuoteChatController extends BaseController {
  listThreads = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const result = await quoteChatService.listThreads(req.user!.id);
    return this.ok(res, result);
  });

  markRead = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const result = await quoteChatService.markThreadRead(
      String(req.params.projectId),
      req.user!.id,
    );
    return this.ok(res, result);
  });

  listPublic = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const result = await quoteChatService.listPublic(String(req.params.token));
    return this.ok(res, result);
  });

  postPublic = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const result = await quoteChatService.postPublic(String(req.params.token), req.body ?? {});
    return this.created(res, result, MESSAGES.CREATED);
  });

  listProject = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const result = await quoteChatService.listForProject(
      String(req.params.projectId),
      req.user!.id,
    );
    return this.ok(res, result);
  });

  postProject = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const result = await quoteChatService.postStaff(
      String(req.params.projectId),
      req.user!.id,
      req.body ?? {},
    );
    return this.created(res, result, MESSAGES.CREATED);
  });
}

export const quoteChatController = new QuoteChatController();
