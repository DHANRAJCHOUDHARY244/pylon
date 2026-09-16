import { Types } from 'mongoose';

import { BaseRepository } from '../base/base.repository.js';
import { Lead, type ILead, type LeadDocument } from '../models/lead.model.js';

export type CreateLeadInput = {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  address?: string;
  status?: ILead['status'];
  source?: string;
  notes?: string;
  valueAud?: number;
  createdBy: Types.ObjectId | string;
};

export type UpdateLeadInput = Partial<Omit<CreateLeadInput, 'createdBy'>>;

export class LeadRepository extends BaseRepository<ILead, CreateLeadInput, UpdateLeadInput> {
  constructor() {
    super(Lead);
  }

  async findByOwner(userId: string, skip: number, limit: number): Promise<LeadDocument[]> {
    return this.model
      .find({ createdBy: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
  }

  async countByOwner(userId: string, filter: Record<string, unknown> = {}): Promise<number> {
    return this.model.countDocuments({ createdBy: userId, ...filter });
  }
}

export const leadRepository = new LeadRepository();
