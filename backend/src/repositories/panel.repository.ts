import type { QueryFilter } from 'mongoose';

import { Panel, type IPanel, type PanelDocument } from '../models/panel.model.js';
import { BaseRepository } from '../base/base.repository.js';

export type PanelSearchFilter = {
  q?: string;
  brand?: string;
  published?: boolean;
};

export class PanelRepository extends BaseRepository<IPanel, never> {
  constructor() {
    super(Panel);
  }

  buildFilter(input: PanelSearchFilter = {}): QueryFilter<IPanel> {
    const filter: QueryFilter<IPanel> = {
      deletedAt: null,
    };

    if (input.published === true) {
      filter.published = true;
    } else if (input.published === false) {
      filter.published = false;
    }

    if (input.brand?.trim()) {
      filter.brand = input.brand.trim();
    }

    const q = input.q?.trim();
    if (q) {
      const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [
        { brand: rx },
        { code: rx },
        { line: rx },
        { sku: rx },
        { cellTech: rx },
        { shortName: rx },
      ];
    }

    return filter;
  }

  async search(
    input: PanelSearchFilter & { skip?: number; limit?: number },
  ): Promise<{ items: PanelDocument[]; total: number }> {
    const filter = this.buildFilter(input);
    const skip = input.skip ?? 0;
    const limit = input.limit ?? 20;

    const [items, total] = await Promise.all([
      this.model
        .find(filter)
        .sort({ brand: 1, stcPmax: -1, code: 1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.model.countDocuments(filter),
    ]);

    return { items, total };
  }

  async findBySku(sku: string): Promise<PanelDocument | null> {
    return this.model.findOne({ sku, deletedAt: null });
  }

  async findBySkus(skus: string[]): Promise<PanelDocument[]> {
    if (!skus.length) return [];
    return this.model.find({ sku: { $in: skus }, deletedAt: null }).exec();
  }

  async listBrands(): Promise<Array<{ brand: string; count: number }>> {
    const rows = await this.model.aggregate<{ _id: string; count: number }>([
      { $match: { deletedAt: null, published: true } },
      { $group: { _id: '$brand', count: { $sum: 1 } } },
      { $sort: { count: -1, _id: 1 } },
    ]);
    return rows
      .filter((r) => r._id)
      .map((r) => ({ brand: r._id, count: r.count }));
  }
}

export const panelRepository = new PanelRepository();
