import { BRANDING_WORKSPACE_KEY } from '../constants/branding.js';
import { buildDefaultBranding, type BrandingDocument, type IBranding } from '../models/branding.model.js';
import { brandingRepository } from '../repositories/branding.repository.js';
import type { BaseEntity } from '../types/index.js';

export type BrandingResponse = BaseEntity & Omit<IBranding, 'workspaceKey'>;

export type UpdateBrandingPayload = Partial<
  Omit<IBranding, 'workspaceKey' | 'createdAt' | 'updatedAt'>
>;

export class BrandingService {
  private serialize(entity: BrandingDocument): BrandingResponse {
    return entity.toJSON() as unknown as BrandingResponse;
  }

  async getPublic(): Promise<BrandingResponse> {
    let doc = await brandingRepository.findByWorkspaceKey(BRANDING_WORKSPACE_KEY);
    if (!doc) {
      doc = await brandingRepository.create(buildDefaultBranding(BRANDING_WORKSPACE_KEY));
    }
    return this.serialize(doc);
  }

  private normalizePayload(payload: UpdateBrandingPayload): UpdateBrandingPayload {
    const next = { ...payload };
    const urlFields = ['logoUrl', 'logoMarkUrl', 'faviconUrl', 'supportUrl'] as const;
    for (const key of urlFields) {
      const value = next[key];
      if (value === '') next[key] = null;
    }
    if (next.supportEmail === '') next.supportEmail = null;
    return next;
  }

  async update(payload: UpdateBrandingPayload): Promise<BrandingResponse> {
    const data = this.normalizePayload(payload);
    let doc = await brandingRepository.findByWorkspaceKey(BRANDING_WORKSPACE_KEY);
    if (!doc) {
      doc = await brandingRepository.create({
        ...buildDefaultBranding(BRANDING_WORKSPACE_KEY),
        ...data,
      });
      return this.serialize(doc);
    }

    const updated = await brandingRepository.updateById(String(doc._id), data);
    if (!updated) {
      return this.serialize(doc);
    }
    return this.serialize(updated);
  }
}

export const brandingService = new BrandingService();
