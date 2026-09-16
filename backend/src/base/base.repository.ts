import type { HydratedDocument, Model, UpdateQuery } from 'mongoose';

import { DEFAULT_SORT } from '../constants/index.js';
import type { BaseListOptions, BaseRepositoryContract } from '../types/index.js';

export class BaseRepository<TEntity, TCreateInput, TUpdateInput = Partial<TCreateInput>>
  implements BaseRepositoryContract<TEntity, TCreateInput, TUpdateInput>
{
  constructor(protected readonly model: Model<TEntity>) {}

  async create(data: TCreateInput): Promise<HydratedDocument<TEntity>> {
    return this.model.create(data as object);
  }

  async findById(id: string): Promise<HydratedDocument<TEntity> | null> {
    return this.model.findById(id);
  }

  async findOne(filter: Partial<TEntity>): Promise<HydratedDocument<TEntity> | null> {
    return this.model.findOne(filter);
  }

  async findMany(options: BaseListOptions<TEntity> = {}): Promise<HydratedDocument<TEntity>[]> {
    const { filter = {}, skip = 0, limit = 20, sort = DEFAULT_SORT } = options;
    return this.model.find(filter).skip(skip).limit(limit).sort(sort);
  }

  async count(filter: Partial<TEntity> = {}): Promise<number> {
    return this.model.countDocuments(filter);
  }

  async updateById(id: string, data: TUpdateInput): Promise<HydratedDocument<TEntity> | null> {
    return this.model.findByIdAndUpdate(id, data as UpdateQuery<TEntity>, {
      new: true,
      runValidators: true,
      includeResultMetadata: false,
    });
  }

  async deleteById(id: string): Promise<HydratedDocument<TEntity> | null> {
    return this.model.findByIdAndDelete(id);
  }
}
