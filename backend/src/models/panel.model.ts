import { Schema, model, type HydratedDocument, type Model } from 'mongoose';

import { COLLECTIONS } from '../constants/index.js';

export interface IPanel {
  sku: string;
  objectId: string;
  brand: string;
  shortName: string | null;
  line: string | null;
  code: string;
  identifier: string | null;
  cellType: string | null;
  cellTech: string | null;
  cellSize: string | null;
  cellCount: number | null;
  junctionBox: string | null;
  cableLength: number | null;
  frameType: string | null;
  /** Module length in mm */
  length: number;
  /** Module width in mm */
  width: number;
  /** Module height/thickness in mm */
  height: number;
  /** Module weight in kg */
  weight: number | null;
  moduleEfficiency: number | null;
  stcPmax: number;
  stcPowerTolerance: string | null;
  stcVmpp: number | null;
  stcImpp: number | null;
  stcVoc: number | null;
  stcIsc: number | null;
  noctPmax: number | null;
  noctVmpp: number | null;
  noctImpp: number | null;
  noctVoc: number | null;
  noctIsc: number | null;
  maximumSystemVoltageIec: number | null;
  maximumSystemVoltageUl: number | null;
  maximumSeriesFuse: number | null;
  imax: number | null;
  tmin: number | null;
  tmax: number | null;
  noctC: number | null;
  noctCRange: number | null;
  tempCoeffPmax: number | null;
  tempCoeffVoc: number | null;
  tempCoeffIsc: number | null;
  deratingPeriod1Duration: number | null;
  deratingPeriod1StartPerformance: number | null;
  deratingPeriod1EndPerformance: number | null;
  deratingPeriod1Rate: number | null;
  deratingPeriod2Duration: number | null;
  deratingPeriod2StartPerformance: number | null;
  deratingPeriod2EndPerformance: number | null;
  deratingPeriod2Rate: number | null;
  imgSrc: string | null;
  notes: string | null;
  files: string | null;
  published: boolean;
  warrantyFileName: string | null;
  installManualFile: string | null;
  installManualName: string | null;
  performanceWarranty: number | null;
  productWarranty: number | null;
  cellCutCountHor: number | null;
  cellCutCountVert: number | null;
  bifacial: boolean;
  bifaciality: number | null;
  country: string | null;
  manufactureCountry: string | null;
  assembledCountry: string | null;
  mcsCertificateFile: string | null;
  mcsCertificate: string | null;
  mcsCertified: boolean;
  iec61215_2021: boolean;
  cecApprovedDate: string | null;
  cecExpiryDate: string | null;
  isGlobal: boolean;
  cecApprovedTs: number | null;
  cecExpiryTs: number | null;
  deletedAt: Date | null;
  sourceCreatedAt: Date | null;
  sourceUpdatedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const panelSchema = new Schema<IPanel>(
  {
    sku: { type: String, required: true, unique: true, trim: true, index: true },
    objectId: { type: String, required: true, trim: true, index: true },
    brand: { type: String, required: true, trim: true, index: true },
    shortName: { type: String, default: null, trim: true },
    line: { type: String, default: null, trim: true, index: true },
    code: { type: String, required: true, trim: true, index: true },
    identifier: { type: String, default: null, trim: true },
    cellType: { type: String, default: null, trim: true },
    cellTech: { type: String, default: null, trim: true },
    cellSize: { type: String, default: null, trim: true },
    cellCount: { type: Number, default: null },
    junctionBox: { type: String, default: null, trim: true },
    cableLength: { type: Number, default: null },
    frameType: { type: String, default: null, trim: true },
    length: { type: Number, required: true },
    width: { type: Number, required: true },
    height: { type: Number, required: true },
    weight: { type: Number, default: null },
    moduleEfficiency: { type: Number, default: null },
    stcPmax: { type: Number, required: true, index: true },
    stcPowerTolerance: { type: String, default: null, trim: true },
    stcVmpp: { type: Number, default: null },
    stcImpp: { type: Number, default: null },
    stcVoc: { type: Number, default: null },
    stcIsc: { type: Number, default: null },
    noctPmax: { type: Number, default: null },
    noctVmpp: { type: Number, default: null },
    noctImpp: { type: Number, default: null },
    noctVoc: { type: Number, default: null },
    noctIsc: { type: Number, default: null },
    maximumSystemVoltageIec: { type: Number, default: null },
    maximumSystemVoltageUl: { type: Number, default: null },
    maximumSeriesFuse: { type: Number, default: null },
    imax: { type: Number, default: null },
    tmin: { type: Number, default: null },
    tmax: { type: Number, default: null },
    noctC: { type: Number, default: null },
    noctCRange: { type: Number, default: null },
    tempCoeffPmax: { type: Number, default: null },
    tempCoeffVoc: { type: Number, default: null },
    tempCoeffIsc: { type: Number, default: null },
    deratingPeriod1Duration: { type: Number, default: null },
    deratingPeriod1StartPerformance: { type: Number, default: null },
    deratingPeriod1EndPerformance: { type: Number, default: null },
    deratingPeriod1Rate: { type: Number, default: null },
    deratingPeriod2Duration: { type: Number, default: null },
    deratingPeriod2StartPerformance: { type: Number, default: null },
    deratingPeriod2EndPerformance: { type: Number, default: null },
    deratingPeriod2Rate: { type: Number, default: null },
    imgSrc: { type: String, default: null, trim: true },
    notes: { type: String, default: null },
    files: { type: String, default: null, trim: true },
    published: { type: Boolean, default: true, index: true },
    warrantyFileName: { type: String, default: null, trim: true },
    installManualFile: { type: String, default: null, trim: true },
    installManualName: { type: String, default: null, trim: true },
    performanceWarranty: { type: Number, default: null },
    productWarranty: { type: Number, default: null },
    cellCutCountHor: { type: Number, default: null },
    cellCutCountVert: { type: Number, default: null },
    bifacial: { type: Boolean, default: false },
    bifaciality: { type: Number, default: null },
    country: { type: String, default: null, trim: true },
    manufactureCountry: { type: String, default: null, trim: true },
    assembledCountry: { type: String, default: null, trim: true },
    mcsCertificateFile: { type: String, default: null, trim: true },
    mcsCertificate: { type: String, default: null, trim: true },
    mcsCertified: { type: Boolean, default: false },
    iec61215_2021: { type: Boolean, default: false },
    cecApprovedDate: { type: String, default: null, trim: true },
    cecExpiryDate: { type: String, default: null, trim: true },
    isGlobal: { type: Boolean, default: false },
    cecApprovedTs: { type: Number, default: null },
    cecExpiryTs: { type: Number, default: null },
    deletedAt: { type: Date, default: null },
    sourceCreatedAt: { type: Date, default: null },
    sourceUpdatedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    collection: COLLECTIONS.PANELS,
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

panelSchema.index({ brand: 1, stcPmax: -1 });
panelSchema.index({ brand: 1, code: 1 });

export type PanelDocument = HydratedDocument<IPanel>;
export type PanelModel = Model<IPanel>;

export const Panel = model<IPanel>('Panel', panelSchema);
