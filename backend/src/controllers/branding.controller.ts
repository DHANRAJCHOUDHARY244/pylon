import type { Response } from 'express';

import { BaseController } from '../base/base.controller.js';
import { MESSAGES } from '../constants/index.js';
import { brandingService } from '../services/branding.service.js';
import type { AuthenticatedRequest } from '../types/index.js';
import { asyncHandler } from '../utils/async-handler.js';

export class BrandingController extends BaseController {
  getPublic = asyncHandler(async (_req, res: Response) => {
    const branding = await brandingService.getPublic();
    return this.ok(res, branding);
  });

  update = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const branding = await brandingService.update(req.body);
    return this.ok(res, branding, MESSAGES.UPDATED);
  });
}

export const brandingController = new BrandingController();
