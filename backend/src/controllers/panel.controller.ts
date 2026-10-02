import type { Response } from 'express';

import { BaseController } from '../base/base.controller.js';
import { omitUndefined } from '../helpers/object.js';
import { panelService } from '../services/panel.service.js';
import type { AuthenticatedRequest } from '../types/index.js';
import { asyncHandler } from '../utils/async-handler.js';

function queryString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function queryPublished(value: unknown): boolean | undefined {
  if (value === 'all') return undefined;
  if (value === 'true' || value === '1') return true;
  if (value === 'false' || value === '0') return false;
  return true;
}

export class PanelController extends BaseController {
  list = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const result = await panelService.list(
      omitUndefined({
        page: Number(req.query.page ?? 1),
        limit: Number(req.query.limit ?? 24),
        q: queryString(req.query.q),
        brand: queryString(req.query.brand),
        published: queryPublished(req.query.published),
      }),
    );
    return this.ok(res, result);
  });

  brands = asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
    return this.ok(res, await panelService.listBrands());
  });

  getBySku = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    return this.ok(res, await panelService.getBySku(String(req.params.sku)));
  });

  getMany = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const raw = typeof req.query.skus === 'string' ? req.query.skus : '';
    const skus = raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 100);
    return this.ok(res, await panelService.getBySkus(skus));
  });

  create = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    return this.created(res, await panelService.create(req.body));
  });

  update = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    return this.ok(res, await panelService.update(String(req.params.sku), req.body));
  });

  remove = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    return this.ok(res, await panelService.remove(String(req.params.sku)));
  });
}

export const panelController = new PanelController();
