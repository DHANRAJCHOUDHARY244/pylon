import type { Response } from 'express';

import { BaseController } from '../base/base.controller.js';
import { omitUndefined } from '../helpers/object.js';
import { taxonomyService } from '../services/taxonomy.service.js';
import type { AuthenticatedRequest } from '../types/index.js';
import { asyncHandler } from '../utils/async-handler.js';

function qStr(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

export class TaxonomyController extends BaseController {
  listBrands = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    return this.ok(
      res,
      await taxonomyService.listBrands(
        omitUndefined({
          page: Number(req.query.page ?? 1),
          limit: Number(req.query.limit ?? 50),
          q: qStr(req.query.q),
          kind: qStr(req.query.kind),
        }),
      ),
    );
  });

  createBrand = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    return this.created(res, await taxonomyService.createBrand(req.body));
  });

  updateBrand = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    return this.ok(res, await taxonomyService.updateBrand(String(req.params.slug), req.body));
  });

  removeBrand = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    return this.ok(res, await taxonomyService.removeBrand(String(req.params.slug)));
  });

  listCategories = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    return this.ok(
      res,
      await taxonomyService.listCategories(
        omitUndefined({
          page: Number(req.query.page ?? 1),
          limit: Number(req.query.limit ?? 50),
          q: qStr(req.query.q),
          kind: qStr(req.query.kind),
        }),
      ),
    );
  });

  createCategory = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    return this.created(res, await taxonomyService.createCategory(req.body));
  });

  updateCategory = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    return this.ok(res, await taxonomyService.updateCategory(String(req.params.slug), req.body));
  });

  removeCategory = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    return this.ok(res, await taxonomyService.removeCategory(String(req.params.slug)));
  });

  sync = asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
    return this.ok(res, await taxonomyService.syncFromEquipment());
  });
}

export const taxonomyController = new TaxonomyController();
