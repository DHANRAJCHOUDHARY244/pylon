import type { QueryFilter } from 'mongoose';

import { Inverter, type IInverter, type InverterDocument } from '../models/inverter.model.js';
import { BaseRepository } from '../base/base.repository.js';

export type InverterSearchFilter = {
  q?: string;
  brand?: string;
  published?: boolean;
  phases?: number;
  mpptMin?: number;
  mpptExact?: number;
  inverterType?: string;
};

export class InverterRepository extends BaseRepository<IInverter, never> {
  constructor() {
    super(Inverter);
  }

  buildFilter(input: InverterSearchFilter = {}): QueryFilter<IInverter> {
    const filter: QueryFilter<IInverter> = { deletedAt: null };

    if (input.published === true) filter.published = true;
    else if (input.published === false) filter.published = false;

    if (input.brand?.trim()) filter.brand = input.brand.trim();

    if (input.phases != null && Number.isFinite(input.phases)) {
      filter.phases = input.phases;
    }

    if (input.mpptExact != null && Number.isFinite(input.mpptExact)) {
      filter.mpptCount = input.mpptExact;
    } else if (input.mpptMin != null && Number.isFinite(input.mpptMin)) {
      filter.mpptCount = { $gte: input.mpptMin };
    }

    if (input.inverterType?.trim()) {
      const t = input.inverterType.trim().toLowerCase();
      if (t === 'hybrid') {
        filter.inverterType = { $regex: /hybrid/i };
      } else if (t === 'pv-only' || t === 'pv') {
        filter.$and = [
          ...(Array.isArray(filter.$and) ? filter.$and : []),
          {
            $or: [
              { inverterType: { $regex: /pv|string|grid/i } },
              { inverterType: null },
            ],
          },
          { inverterType: { $not: /hybrid|battery/i } },
        ];
      } else if (t === 'battery-only' || t === 'battery') {
        filter.inverterType = { $regex: /battery/i };
      } else {
        filter.inverterType = { $regex: new RegExp(t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') };
      }
    }

    const q = input.q?.trim();
    if (q) {
      const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ brand: rx }, { code: rx }, { name: rx }, { sku: rx }, { inverterType: rx }];
    }

    return filter;
  }

  async search(
    input: InverterSearchFilter & { skip?: number; limit?: number },
  ): Promise<{ items: InverterDocument[]; total: number }> {
    const filter = this.buildFilter(input);
    const skip = input.skip ?? 0;
    const limit = input.limit ?? 20;

    const [items, total] = await Promise.all([
      this.model
        .find(filter)
        .sort({ brand: 1, watts: -1, code: 1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.model.countDocuments(filter),
    ]);

    return { items, total };
  }

  async findBySku(sku: string): Promise<InverterDocument | null> {
    return this.model.findOne({ sku, deletedAt: null });
  }

  async findBySkus(skus: string[]): Promise<InverterDocument[]> {
    if (!skus.length) return [];
    return this.model.find({ sku: { $in: skus }, deletedAt: null }).exec();
  }

  async listBrands(): Promise<Array<{ brand: string; count: number }>> {
    const rows = await this.model.aggregate<{ _id: string; count: number }>([
      { $match: { deletedAt: null, published: true } },
      { $group: { _id: '$brand', count: { $sum: 1 } } },
      { $sort: { count: -1, _id: 1 } },
    ]);
    return rows.filter((r) => r._id).map((r) => ({ brand: r._id, count: r.count }));
  }
}

export const inverterRepository = new InverterRepository();
