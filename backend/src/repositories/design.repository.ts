import { BaseRepository } from '../base/base.repository.js';
import { Design, type IDesign, type DesignDocument } from '../models/design.model.js';
import { Types } from 'mongoose';

export type CreateDesignInput = {
  projectId: Types.ObjectId;
  proposalId?: string | null;
  schemaVersion: number;
  version: number;
  isCurrent: boolean;
  panels: IDesign['panels'];
  roofs: IDesign['roofs'];
  objects?: IDesign['objects'];
  mapCenter: IDesign['mapCenter'];
  mapOrigin?: IDesign['mapOrigin'];
  mapBearing?: number;
  mapPitch?: number;
  zoom: number;
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
  createdBy: Types.ObjectId;
};

export type UpdateDesignInput = Partial<
  Pick<
    IDesign,
    | 'panels'
    | 'roofs'
    | 'objects'
    | 'mapCenter'
    | 'mapOrigin'
    | 'mapBearing'
    | 'mapPitch'
    | 'zoom'
    | 'schemaVersion'
    | 'proposalId'
    | 'version'
    | 'moduleTempC'
    | 'coldDesignTempC'
    | 'designVoltageDcV'
    | 'designVoltageAcV'
    | 'siteAddress'
    | 'mapImageryMode'
    | 'activeImageryId'
    | 'production'
    | 'shading'
    | 'sld'
    | 'isCurrent'
  >
>;

export class DesignRepository extends BaseRepository<IDesign, CreateDesignInput, UpdateDesignInput> {
  constructor() {
    super(Design);
  }

  async findCurrentByProjectId(projectId: string): Promise<DesignDocument | null> {
    return this.findOne({
      projectId: new Types.ObjectId(projectId),
      isCurrent: true,
    } as Partial<IDesign>);
  }

  async findCurrentByProposalId(proposalId: string): Promise<DesignDocument | null> {
    return this.findOne({
      proposalId,
      isCurrent: true,
    } as Partial<IDesign>);
  }

  async listByProjectId(projectId: string, limit = 30): Promise<DesignDocument[]> {
    return this.findMany({
      filter: { projectId: new Types.ObjectId(projectId) } as Partial<IDesign>,
      skip: 0,
      limit,
      sort: { version: -1 },
    });
  }

  async findByProjectAndId(projectId: string, designId: string): Promise<DesignDocument | null> {
    const doc = await this.findById(designId);
    if (!doc) return null;
    if (String(doc.projectId) !== projectId) return null;
    return doc;
  }
}

export const designRepository = new DesignRepository();
