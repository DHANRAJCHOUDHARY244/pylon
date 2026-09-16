import type { Response } from 'express';

import { BaseController } from '../base/base.controller.js';
import { MESSAGES } from '../constants/index.js';
import { projectService } from '../services/project.service.js';
import type { AuthenticatedRequest } from '../types/index.js';
import { asyncHandler } from '../utils/async-handler.js';

export class ProjectController extends BaseController {
  list = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const q = typeof req.query.q === 'string' ? req.query.q : undefined;
    const result = await projectService.listForUser(req.user!.id, {
      page: Number(req.query.page ?? 1),
      limit: Number(req.query.limit ?? 20),
      ...(q ? { q } : {}),
    });
    return this.ok(res, result);
  });

  create = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const result = await projectService.createForUser(req.user!.id, req.body);
    return this.created(res, result, MESSAGES.CREATED);
  });

  getById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const result = await projectService.getDetailForUser(String(req.params.projectId), req.user!.id);
    return this.ok(res, result);
  });

  updateSite = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const result = await projectService.updateSiteForUser(
      String(req.params.projectId),
      req.user!.id,
      req.body,
    );
    return this.ok(res, result, MESSAGES.UPDATED);
  });

  updateEquipment = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const result = await projectService.updateEquipmentForUser(
      String(req.params.projectId),
      req.user!.id,
      req.body,
    );
    return this.ok(res, result, MESSAGES.UPDATED);
  });
}

export const projectController = new ProjectController();
