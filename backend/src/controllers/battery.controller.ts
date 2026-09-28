import type { Response } from 'express';

import { BaseController } from '../base/base.controller.js';
import { omitUndefined } from '../helpers/object.js';
import { batteryService } from '../services/battery.service.js';
import type { AuthenticatedRequest } from '../types/index.js';
import { asyncHandler } from '../utils/async-handler.js';

function queryString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function queryBool(value: unknown): boolean | undefined {
  if (value === 'true' || value === '1') return true;
  if (value === 'false' || value === '0') return false;
  return undefined;
}

export class BatteryController extends BaseController {
  list = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const result = await batteryService.list(
      omitUndefined({
        page: Number(req.query.page ?? 1),
        limit: Number(req.query.limit ?? 24),
        q: queryString(req.query.q),
        brand: queryString(req.query.brand),
        published: queryBool(req.query.published) ?? true,
      }),
    );
    return this.ok(res, result);
  });

  brands = asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
    return this.ok(res, await batteryService.listBrands());
  });

  getBySku = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    return this.ok(res, await batteryService.getBySku(String(req.params.sku)));
  });

  getMany = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const raw = typeof req.query.skus === 'string' ? req.query.skus : '';
    const skus = raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 100);
    return this.ok(res, await batteryService.getBySkus(skus));
  });
}

export const batteryController = new BatteryController();
