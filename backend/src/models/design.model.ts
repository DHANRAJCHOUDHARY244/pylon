import { Schema, Types, model, type HydratedDocument, type Model } from 'mongoose';

import { COLLECTIONS, DESIGN_SCHEMA_VERSION } from '../constants/index.js';

/** Panel / roof coordinates are world meters east/north of map center (schema ≥ 2). */
export interface IPlacedPanel {
  id: string;
  catalogId: string;
  x: number;
  y: number;
  rotation: 0 | 90 | number;
  orientation?: 'portrait' | 'landscape';
  groupId?: string | null;
  existing?: boolean;
  masked?: boolean;
  widthM?: number;
  heightM?: number;
  stringId?: string | null;
  optimizerCatalogId?: string | null;
}

export interface IRoofRect {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  pitchDeg?: number;
  azimuthDeg?: number;
}

/** Flexible design object bag (roof_face, panel, inverter, battery, string, …). */
export type IDesignObject = Record<string, unknown> & {
  type: string;
  id: string;
};

export interface IDesign {
  projectId: Types.ObjectId;
  proposalId: string | null;
  schemaVersion: number;
  version: number;
  isCurrent: boolean;
  panels: IPlacedPanel[];
  roofs: IRoofRect[];
  objects: IDesignObject[];
  mapCenter: { lat: number; lng: number };
  mapOrigin?: { lat: number; lng: number } | null;
  mapBearing?: number;
  mapPitch?: number;
  zoom: number;
  moduleTempC: number;
  coldDesignTempC: number;
  designVoltageDcV: number | null;
  designVoltageAcV: number | null;
  siteAddress: string | null;
  mapImageryMode: 'hybrid' | 'satellite' | 'roadmap' | 'fallback';
  activeImageryId: string | null;
  production: Record<string, unknown> | null;
  shading: Record<string, unknown> | null;
  sld: Record<string, unknown> | null;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const placedPanelSchema = new Schema<IPlacedPanel>(
  {
    id: { type: String, required: true },
    catalogId: { type: String, required: true },
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    rotation: { type: Number, default: 0 },
    orientation: { type: String, enum: ['portrait', 'landscape'] },
    groupId: { type: String, default: null },
    existing: { type: Boolean, default: false },
    masked: { type: Boolean, default: false },
    stringId: { type: String, default: null },
    optimizerCatalogId: { type: String, default: null },
    widthM: { type: Number },
    heightM: { type: Number },
  },
  { _id: false },
);

const roofRectSchema = new Schema<IRoofRect>(
  {
    id: { type: String, required: true },
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    w: { type: Number, required: true },
    h: { type: Number, required: true },
    pitchDeg: { type: Number },
    azimuthDeg: { type: Number },
  },
  { _id: false },
);

const flexibleObjectSchema = new Schema(
  {
    type: { type: String, required: true },
    id: { type: String, required: true },
  },
  { _id: false, strict: false },
);

const designSchema = new Schema<IDesign>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    proposalId: { type: String, default: null, index: true },
    schemaVersion: { type: Number, default: DESIGN_SCHEMA_VERSION },
    version: { type: Number, default: 1 },
    isCurrent: { type: Boolean, default: true, index: true },
    panels: { type: [placedPanelSchema], default: [] },
    roofs: { type: [roofRectSchema], default: [] },
    objects: { type: [flexibleObjectSchema], default: [] },
    mapCenter: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    mapOrigin: {
      lat: { type: Number },
      lng: { type: Number },
    },
    mapBearing: { type: Number, default: 0 },
    mapPitch: { type: Number, default: 0 },
    zoom: { type: Number, default: 19 },
    moduleTempC: { type: Number, default: 45 },
    coldDesignTempC: { type: Number, default: -5 },
    designVoltageDcV: { type: Number, default: 400 },
    designVoltageAcV: { type: Number, default: 230 },
    siteAddress: { type: String, default: null },
    mapImageryMode: {
      type: String,
      enum: ['hybrid', 'satellite', 'roadmap', 'fallback'],
      default: 'satellite',
    },
    activeImageryId: { type: String, default: null },
    production: { type: Schema.Types.Mixed, default: null },
    shading: { type: Schema.Types.Mixed, default: null },
    sld: { type: Schema.Types.Mixed, default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  {
    timestamps: true,
    collection: COLLECTIONS.DESIGNS,
    toJSON: {
      virtuals: true,
      transform(_doc, ret) {
        const raw = ret as Record<string, unknown>;
        const id = String(raw['_id']);
        delete raw['_id'];
        delete raw['__v'];
        return { id, ...raw };
      },
    },
  },
);

designSchema.index({ projectId: 1, isCurrent: 1 });

export type DesignDocument = HydratedDocument<IDesign>;
export type DesignModel = Model<IDesign>;

export const Design = model<IDesign>('Design', designSchema);
