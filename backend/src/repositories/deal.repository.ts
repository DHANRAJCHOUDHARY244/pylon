import { Types } from 'mongoose';

import { BaseRepository } from '../base/base.repository.js';
import { Deal, type DealDocument, type IDeal } from '../models/deal.model.js';

export type CreateDealInput = {
  title: string;
  stage?: IDeal['stage'];
  valueAud?: number;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  leadId?: Types.ObjectId | string | null;
  customerId?: Types.ObjectId | string | null;
  projectId?: Types.ObjectId | string | null;
  expectedCloseAt?: Date | string | null;
  notes?: string;
  starred?: boolean;
  lostReason?: string;
  quote?: IDeal['quote'];
  createdBy: Types.ObjectId | string;
};

export type UpdateDealInput = Partial<Omit<CreateDealInput, 'createdBy'>>;

export class DealRepository extends BaseRepository<IDeal, CreateDealInput, UpdateDealInput> {
  constructor() {
    super(Deal);
  }

  async findByOwner(userId: string, skip = 0, limit = 100): Promise<DealDocument[]> {
    return this.model
      .find({ createdBy: userId })
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit);
  }

  async findByOwnerAndProject(userId: string, projectId: string): Promise<DealDocument | null> {
    return this.model
      .findOne({ createdBy: userId, projectId: new Types.ObjectId(projectId) })
      .sort({ updatedAt: -1 });
  }

  async countByOwner(userId: string, filter: Record<string, unknown> = {}): Promise<number> {
    return this.model.countDocuments({ createdBy: userId, ...filter });
  }
}

export const dealRepository = new DealRepository();
