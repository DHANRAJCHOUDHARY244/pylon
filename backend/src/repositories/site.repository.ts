import { BaseRepository } from '../base/base.repository.js';
import { Site, type ISite, type SiteDocument } from '../models/site.model.js';
import { Types } from 'mongoose';

export type CreateSiteInput = {
  projectId: Types.ObjectId;
  address: string;
  lat: number;
  lng: number;
};

export type UpdateSiteInput = Partial<Pick<ISite, 'address' | 'lat' | 'lng'>>;

export class SiteRepository extends BaseRepository<ISite, CreateSiteInput, UpdateSiteInput> {
  constructor() {
    super(Site);
  }

  async findByProjectId(projectId: string): Promise<SiteDocument | null> {
    return this.findOne({ projectId: new Types.ObjectId(projectId) } as Partial<ISite>);
  }
}

export const siteRepository = new SiteRepository();
