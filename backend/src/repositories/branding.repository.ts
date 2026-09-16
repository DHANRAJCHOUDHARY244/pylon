import { BaseRepository } from '../base/base.repository.js';
import { Branding, type IBranding, type BrandingDocument } from '../models/branding.model.js';

export type UpdateBrandingInput = Partial<
  Omit<IBranding, 'workspaceKey' | 'createdAt' | 'updatedAt'>
>;

export type CreateBrandingInput = Omit<IBranding, 'createdAt' | 'updatedAt'>;

export class BrandingRepository extends BaseRepository<IBranding, CreateBrandingInput, UpdateBrandingInput> {
  constructor() {
    super(Branding);
  }

  async findByWorkspaceKey(workspaceKey: string): Promise<BrandingDocument | null> {
    return this.findOne({ workspaceKey } as Partial<IBranding>);
  }
}

export const brandingRepository = new BrandingRepository();
