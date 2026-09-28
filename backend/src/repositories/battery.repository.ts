import type { QueryFilter } from 'mongoose';

import { Battery, type IBattery, type BatteryDocument } from '../models/battery.model.js';
import { BaseRepository } from '../base/base.repository.js';

export type BatterySearchFilter = {
  q?: string;
  brand?: string;
  published?: boolean;
};

export class BatteryRepository extends BaseRepository<IBattery, never> {
  constructor() {
    super(Battery);
  }

  buildFilter(input: BatterySearchFilter = {}): QueryFilter<IBattery> {
    const filter: QueryFilter<IBattery> = { deletedAt: null };

    if (input.published === true) filter.published = true;
    else if (input.published === false) filter.published = false;

    if (input.brand?.trim()) filter.brand = input.brand.trim();

    const q = input.q?.trim();
    if (q) {
      const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ brand: rx }, { code: rx }, { name: rx }, { sku: rx }];
    }

    return filter;
  }

  async search(
    input: BatterySearchFilter & { skip?: number; limit?: number },
  ): Promise<{ items: BatteryDocument[]; total: number }> {
    const filter = this.buildFilter(input);
    const skip = input.skip ?? 0;
    const limit = input.limit ?? 20;

    const [items, total] = await Promise.all([
      this.model
        .find(filter)
        .sort({ brand: 1, capacityKwh: -1, code: 1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.model.countDocuments(filter),
    ]);

    return { items, total };
  }

  async findBySku(sku: string): Promise<BatteryDocument | null> {
    return this.model.findOne({ sku, deletedAt: null });
  }

  async findBySkus(skus: string[]): Promise<BatteryDocument[]> {
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

export const batteryRepository = new BatteryRepository();
