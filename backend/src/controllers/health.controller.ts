import type { Request, Response } from 'express';

import { BaseController } from '../base/base.controller.js';
import { appConfig } from '../config/index.js';
import { asyncHandler } from '../utils/async-handler.js';

export class HealthController extends BaseController {
  check = asyncHandler(async (_req: Request, res: Response) => {
    return this.ok(res, {
      status: 'ok',
      service: appConfig.name,
      version: appConfig.version,
      timestamp: new Date().toISOString(),
    });
  });
}

export const healthController = new HealthController();
