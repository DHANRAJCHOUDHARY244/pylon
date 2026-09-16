import { BaseService } from '../base/base.service.js';
import { DESIGN_SCHEMA_VERSION } from '../constants/index.js';
import type { IDesign, DesignDocument } from '../models/design.model.js';
import { designRepository } from '../repositories/design.repository.js';
import { projectRepository } from '../repositories/project.repository.js';
import type { BaseEntity } from '../types/index.js';
import { NotFoundError } from '../utils/errors.js';

export type DesignResponse = BaseEntity & {
  projectId: string;
  proposalId: string | null;
  schemaVersion: number;
  version: number;
  isCurrent: boolean;
  panels: IDesign['panels'];
  roofs: IDesign['roofs'];
  objects: IDesign['objects'];
  mapCenter: IDesign['mapCenter'];
  mapOrigin?: IDesign['mapOrigin'];
  mapBearing?: number;
  mapPitch?: number;
  zoom: number;
  moduleTempC: number;
  coldDesignTempC: number;
  designVoltageDcV: number | null;
  designVoltageAcV: number | null;
  siteAddress: string | null;
  mapImageryMode: IDesign['mapImageryMode'];
  activeImageryId: string | null;
  production: Record<string, unknown> | null;
  shading: Record<string, unknown> | null;
  sld: Record<string, unknown> | null;
};

export type SaveDesignInput = {
  panels: IDesign['panels'];
  roofs: IDesign['roofs'];
  objects?: IDesign['objects'];
  mapCenter: IDesign['mapCenter'];
  mapOrigin?: IDesign['mapOrigin'];
  mapBearing?: number;
  mapPitch?: number;
  zoom: number;
  schemaVersion?: number;
  proposalId?: string | null;
  moduleTempC?: number;
  coldDesignTempC?: number;
  designVoltageDcV?: number | null;
  designVoltageAcV?: number | null;
  siteAddress?: string | null;
  mapImageryMode?: IDesign['mapImageryMode'];
  activeImageryId?: string | null;
  production?: Record<string, unknown> | null;
  shading?: Record<string, unknown> | null;
  sld?: Record<string, unknown> | null;
};

function buildObjects(
  panels: IDesign['panels'],
  roofs: IDesign['roofs'],
  objects?: IDesign['objects'],
): IDesign['objects'] {
  if (objects && objects.length > 0) return objects;
  return [
    ...roofs.map((r) => ({
      type: 'roof_rect' as const,
      id: r.id,
      x: r.x,
      y: r.y,
      w: r.w,
      h: r.h,
    })),
    ...panels.map((p) => ({
      type: 'panel' as const,
      id: p.id,
      catalogId: p.catalogId,
      x: p.x,
      y: p.y,
      rotation: p.rotation,
    })),
  ];
}

export class DesignService extends BaseService<IDesign, DesignResponse, SaveDesignInput> {
  constructor() {
    super(designRepository);
  }

  protected override getEntityLabel(): string {
    return 'Design';
  }

  protected serialize(entity: DesignDocument): DesignResponse {
    const json = entity.toJSON() as unknown as Record<string, unknown>;
    return {
      id: String(json.id),
      projectId: String(json.projectId),
      proposalId: json.proposalId ? String(json.proposalId) : null,
      schemaVersion: Number(json.schemaVersion),
      version: Number(json.version),
      isCurrent: Boolean(json.isCurrent),
      panels: json.panels as IDesign['panels'],
      roofs: json.roofs as IDesign['roofs'],
      objects: (json.objects as IDesign['objects']) ?? [],
      mapCenter: json.mapCenter as IDesign['mapCenter'],
      mapOrigin: (json.mapOrigin as IDesign['mapOrigin']) ?? (json.mapCenter as IDesign['mapCenter']),
      mapBearing: Number(json.mapBearing ?? 0),
      mapPitch: Number(json.mapPitch ?? 0),
      zoom: Number(json.zoom),
      moduleTempC: Number(json.moduleTempC ?? 45),
      coldDesignTempC: Number(json.coldDesignTempC ?? -5),
      designVoltageDcV:
        json.designVoltageDcV == null ? null : Number(json.designVoltageDcV),
      designVoltageAcV:
        json.designVoltageAcV == null ? null : Number(json.designVoltageAcV),
      siteAddress: json.siteAddress ? String(json.siteAddress) : null,
      mapImageryMode: (json.mapImageryMode as IDesign['mapImageryMode']) ?? 'satellite',
      activeImageryId: json.activeImageryId ? String(json.activeImageryId) : null,
      production: (json.production as Record<string, unknown> | null) ?? null,
      shading: (json.shading as Record<string, unknown> | null) ?? null,
      sld: (json.sld as Record<string, unknown> | null) ?? null,
      createdAt: json.createdAt as string,
      updatedAt: json.updatedAt as string,
    };
  }

  async getCurrentForProject(projectId: string, userId: string): Promise<DesignResponse> {
    await this.assertProjectAccess(projectId, userId);
    const design = await designRepository.findCurrentByProjectId(projectId);
    if (!design) {
      throw new NotFoundError('Design not found');
    }
    return this.serialize(design);
  }

  async saveCurrentForProject(
    projectId: string,
    userId: string,
    input: SaveDesignInput,
  ): Promise<DesignResponse> {
    await this.assertProjectAccess(projectId, userId);
    const design = await designRepository.findCurrentByProjectId(projectId);
    if (!design) {
      throw new NotFoundError('Design not found');
    }

    const objects = buildObjects(input.panels, input.roofs, input.objects);
    const nextVersion = (design.version ?? 1) + 1;

    // Snapshot previous current before overwrite (enables version restore)
    await designRepository.create({
      projectId: design.projectId,
      proposalId: design.proposalId,
      schemaVersion: design.schemaVersion,
      version: design.version ?? 1,
      isCurrent: false,
      panels: design.panels,
      roofs: design.roofs,
      objects: design.objects ?? [],
      mapCenter: design.mapCenter,
      mapOrigin: design.mapOrigin ?? design.mapCenter,
      mapBearing: design.mapBearing ?? 0,
      mapPitch: design.mapPitch ?? 0,
      zoom: design.zoom,
      moduleTempC: design.moduleTempC,
      coldDesignTempC: design.coldDesignTempC,
      designVoltageDcV: design.designVoltageDcV,
      designVoltageAcV: design.designVoltageAcV,
      siteAddress: design.siteAddress,
      mapImageryMode: design.mapImageryMode,
      activeImageryId: design.activeImageryId,
      production: design.production ?? null,
      shading: design.shading ?? null,
      sld: design.sld ?? null,
      createdBy: design.createdBy,
    });

    const updated = await designRepository.updateById(String(design._id), {
      panels: input.panels,
      roofs: input.roofs,
      objects,
      mapCenter: input.mapCenter,
      mapOrigin: input.mapOrigin ?? input.mapCenter,
      mapBearing: input.mapBearing ?? 0,
      mapPitch: input.mapPitch ?? 0,
      zoom: input.zoom,
      schemaVersion: input.schemaVersion ?? DESIGN_SCHEMA_VERSION,
      proposalId: input.proposalId ?? design.proposalId,
      moduleTempC: input.moduleTempC ?? design.moduleTempC ?? 45,
      coldDesignTempC: input.coldDesignTempC ?? design.coldDesignTempC ?? -5,
      designVoltageDcV:
        input.designVoltageDcV !== undefined
          ? input.designVoltageDcV
          : (design.designVoltageDcV ?? 400),
      designVoltageAcV:
        input.designVoltageAcV !== undefined
          ? input.designVoltageAcV
          : (design.designVoltageAcV ?? 230),
      siteAddress:
        input.siteAddress !== undefined ? input.siteAddress : (design.siteAddress ?? null),
      mapImageryMode: input.mapImageryMode ?? design.mapImageryMode ?? 'satellite',
      activeImageryId:
        input.activeImageryId !== undefined
          ? input.activeImageryId
          : (design.activeImageryId ?? null),
      production:
        input.production !== undefined ? input.production : (design.production ?? null),
      shading: input.shading !== undefined ? input.shading : (design.shading ?? null),
      sld: input.sld !== undefined ? input.sld : (design.sld ?? null),
      version: nextVersion,
      isCurrent: true,
    });

    if (!updated) {
      throw new NotFoundError('Design not found');
    }

    return this.serialize(updated);
  }

  async listVersionsForProject(
    projectId: string,
    userId: string,
  ): Promise<Array<{ id: string; version: number; isCurrent: boolean; updatedAt: string }>> {
    await this.assertProjectAccess(projectId, userId);
    const rows = await designRepository.listByProjectId(projectId, 40);
    return rows.map((d) => {
      const json = d.toJSON() as unknown as Record<string, unknown>;
      return {
        id: String(json.id),
        version: Number(json.version),
        isCurrent: Boolean(json.isCurrent),
        updatedAt: String(json.updatedAt ?? ''),
      };
    });
  }

  async restoreVersionForProject(
    projectId: string,
    userId: string,
    designVersionId: string,
  ): Promise<DesignResponse> {
    await this.assertProjectAccess(projectId, userId);
    const current = await designRepository.findCurrentByProjectId(projectId);
    const target = await designRepository.findByProjectAndId(projectId, designVersionId);
    if (!current || !target) {
      throw new NotFoundError('Design version not found');
    }

    // Archive live current before restore
    await designRepository.create({
      projectId: current.projectId,
      proposalId: current.proposalId,
      schemaVersion: current.schemaVersion,
      version: current.version ?? 1,
      isCurrent: false,
      panels: current.panels,
      roofs: current.roofs,
      objects: current.objects ?? [],
      mapCenter: current.mapCenter,
      mapOrigin: current.mapOrigin ?? current.mapCenter,
      mapBearing: current.mapBearing ?? 0,
      mapPitch: current.mapPitch ?? 0,
      zoom: current.zoom,
      moduleTempC: current.moduleTempC,
      coldDesignTempC: current.coldDesignTempC,
      designVoltageDcV: current.designVoltageDcV,
      designVoltageAcV: current.designVoltageAcV,
      siteAddress: current.siteAddress,
      mapImageryMode: current.mapImageryMode,
      activeImageryId: current.activeImageryId,
      production: current.production ?? null,
      shading: current.shading ?? null,
      sld: current.sld ?? null,
      createdBy: current.createdBy,
    });

    const restored = await designRepository.updateById(String(current._id), {
      panels: target.panels,
      roofs: target.roofs,
      objects: target.objects ?? [],
      mapCenter: target.mapCenter,
      mapOrigin: target.mapOrigin ?? target.mapCenter,
      mapBearing: target.mapBearing ?? 0,
      mapPitch: target.mapPitch ?? 0,
      zoom: target.zoom,
      schemaVersion: target.schemaVersion,
      proposalId: target.proposalId,
      moduleTempC: target.moduleTempC,
      coldDesignTempC: target.coldDesignTempC,
      designVoltageDcV: target.designVoltageDcV,
      designVoltageAcV: target.designVoltageAcV,
      siteAddress: target.siteAddress,
      mapImageryMode: target.mapImageryMode,
      activeImageryId: target.activeImageryId,
      production: target.production ?? null,
      shading: target.shading ?? null,
      sld: target.sld ?? null,
      version: (current.version ?? 1) + 1,
      isCurrent: true,
    });

    if (!restored) {
      throw new NotFoundError('Design not found');
    }
    return this.serialize(restored);
  }

  private async assertProjectAccess(projectId: string, userId: string): Promise<void> {
    const project = await projectRepository.findOwnedById(projectId, userId);
    if (!project) {
      throw new NotFoundError('Project not found');
    }
  }
}

export const designService = new DesignService();
