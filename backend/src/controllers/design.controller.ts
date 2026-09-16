import type { Response } from 'express';

import { BaseController } from '../base/base.controller.js';
import { MESSAGES } from '../constants/index.js';
import { designService } from '../services/design.service.js';
import type { AuthenticatedRequest } from '../types/index.js';
import { asyncHandler } from '../utils/async-handler.js';

export class DesignController extends BaseController {
  getCurrent = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const projectId = String(req.params.projectId);
    const result = await designService.getCurrentForProject(projectId, req.user!.id);
    return this.ok(res, result);
  });

  saveCurrent = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const projectId = String(req.params.projectId);
    const result = await designService.saveCurrentForProject(projectId, req.user!.id, req.body);
    return this.ok(res, result, MESSAGES.UPDATED);
  });

  listVersions = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const projectId = String(req.params.projectId);
    const result = await designService.listVersionsForProject(projectId, req.user!.id);
    return this.ok(res, result);
  });

  restoreVersion = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const projectId = String(req.params.projectId);
    const designId = String(req.params.designId);
    const result = await designService.restoreVersionForProject(
      projectId,
      req.user!.id,
      designId,
    );
    return this.ok(res, result, MESSAGES.UPDATED);
  });
}

export const designController = new DesignController();
