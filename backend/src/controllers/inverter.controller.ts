import type { Response } from 'express';

import { BaseController } from '../base/base.controller.js';
import { omitUndefined } from '../helpers/object.js';
import { inverterService } from '../services/inverter.service.js';
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

export class InverterController extends BaseController {
  list = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const phasesRaw = queryString(req.query.phases);
    const mpptRaw = queryString(req.query.mppt);
    const typeRaw = queryString(req.query.type);
    let phases: number | undefined;
    let mpptExact: number | undefined;
    let mpptMin: number | undefined;
    if (phasesRaw === '1' || phasesRaw === 'single') phases = 1;
    else if (phasesRaw === '3' || phasesRaw === 'three') phases = 3;
    else if (phasesRaw && Number.isFinite(Number(phasesRaw))) phases = Number(phasesRaw);
    if (mpptRaw === '4+' || mpptRaw === '4plus') mpptMin = 4;
    else if (mpptRaw && Number.isFinite(Number(mpptRaw))) mpptExact = Number(mpptRaw);

    const result = await inverterService.list(
      omitUndefined({
        page: Number(req.query.page ?? 1),
        limit: Number(req.query.limit ?? 24),
        q: queryString(req.query.q),
        brand: queryString(req.query.brand),
        published: queryPublished(req.query.published),
        phases,
        mpptExact,
        mpptMin,
        inverterType: typeRaw,
      }),
    );
    return this.ok(res, result);
  });

  brands = asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
    return this.ok(res, await inverterService.listBrands());
  });

  getBySku = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    return this.ok(res, await inverterService.getBySku(String(req.params.sku)));
  });

  getMany = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const raw = typeof req.query.skus === 'string' ? req.query.skus : '';
    const skus = raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 100);
    return this.ok(res, await inverterService.getBySkus(skus));
  });

  create = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    return this.created(res, await inverterService.create(req.body));
  });

  update = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    return this.ok(res, await inverterService.update(String(req.params.sku), req.body));
  });

  remove = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    return this.ok(res, await inverterService.remove(String(req.params.sku)));
  });
}

export const inverterController = new InverterController();
