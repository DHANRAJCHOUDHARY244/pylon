import { Schema, model, type HydratedDocument, type Model } from 'mongoose';

import { COLLECTIONS } from '../constants/index.js';

export interface IInverter {
  sku: string;
  objectId: string;
  brand: string;
  brandLogo: string | null;
  name: string;
  code: string;
  photo: string | null;
  datasheet: string | null;
  /** Rated / max AC power in watts */
  watts: number;
  nominalAcPowerW: number | null;
  maxDcPowerW: number | null;
  mpptCount: number | null;
  phases: number | null;
  maxDcVoltageV: number | null;
  mpptMinV: number | null;
  mpptMaxV: number | null;
  maxInputCurrentPerMpptA: number | null;
  inverterType: string | null;
  heightMm: number | null;
  widthMm: number | null;
  depthMm: number | null;
  weightKg: number | null;
  maxEfficiency: number | null;
  productWarranty: string | null;
  unitCost: number | null;
  unitPrice: number | null;
  published: boolean;
  source: string;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const inverterSchema = new Schema<IInverter>(
  {
    sku: { type: String, required: true, unique: true, trim: true, index: true },
    objectId: { type: String, required: true, trim: true, index: true },
    brand: { type: String, required: true, trim: true, index: true },
    brandLogo: { type: String, default: null },
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true, index: true },
    photo: { type: String, default: null },
    datasheet: { type: String, default: null },
    watts: { type: Number, required: true, index: true },
    nominalAcPowerW: { type: Number, default: null },
    maxDcPowerW: { type: Number, default: null },
    mpptCount: { type: Number, default: null },
    phases: { type: Number, default: null },
    maxDcVoltageV: { type: Number, default: null },
    mpptMinV: { type: Number, default: null },
    mpptMaxV: { type: Number, default: null },
    maxInputCurrentPerMpptA: { type: Number, default: null },
    inverterType: { type: String, default: null },
    heightMm: { type: Number, default: null },
    widthMm: { type: Number, default: null },
    depthMm: { type: Number, default: null },
    weightKg: { type: Number, default: null },
    maxEfficiency: { type: Number, default: null },
    productWarranty: { type: String, default: null },
    unitCost: { type: Number, default: null },
    unitPrice: { type: Number, default: null },
    published: { type: Boolean, default: true, index: true },
    source: { type: String, default: 'greensketch', trim: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: COLLECTIONS.INVERTERS },
);

inverterSchema.index({ brand: 1, watts: -1 });
inverterSchema.index({ brand: 1, code: 1 });

export type InverterDocument = HydratedDocument<IInverter>;
export type InverterModel = Model<IInverter>;

export const Inverter = model<IInverter>('Inverter', inverterSchema);
