import type { Response } from 'express';

import { BaseController } from '../base/base.controller.js';
import { MESSAGES } from '../constants/index.js';
import { proposalSignService } from '../services/proposal-sign.service.js';
import type { AuthenticatedRequest } from '../types/index.js';
import { asyncHandler } from '../utils/async-handler.js';

export class ProposalSignController extends BaseController {
  /** Auth: create a customer signing link for a project. */
  create = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const result = await proposalSignService.createForProject(
      String(req.params.projectId),
      req.user!.id,
      req.body,
    );
    return this.created(res, result, MESSAGES.CREATED);
  });

  list = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const result = await proposalSignService.listForProject(
      String(req.params.projectId),
      req.user!.id,
    );
    return this.ok(res, result);
  });

  /** Public: load signing package by token. */
  getPublic = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const result = await proposalSignService.getPublicByToken(String(req.params.token));
    return this.ok(res, result);
  });

  /** Public: advance signing steps / complete signature. */
  advance = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const result = await proposalSignService.advance(String(req.params.token), req.body ?? {});
    return this.ok(res, result, MESSAGES.UPDATED);
  });
}

export const proposalSignController = new ProposalSignController();
