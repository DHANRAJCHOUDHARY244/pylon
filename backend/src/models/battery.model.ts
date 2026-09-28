import { Schema, model, type HydratedDocument, type Model } from 'mongoose';

import { COLLECTIONS } from '../constants/index.js';

export interface IBattery {
  sku: string;
  objectId: string;
  brand: string;
  brandLogo: string | null;
  name: string;
  code: string;
  photo: string | null;
  datasheet: string | null;
  /** Nominal energy kWh */
  capacityKwh: number;
  usableKwh: number;
  /** 0–1 fraction */
  depthOfDischarge: number | null;
  roundTripEfficiency: number | null;
  lengthMm: number | null;
  widthMm: number | null;
  heightMm: number | null;
  weightKg: number | null;
  chemistry: string | null;
  ratedDcVoltageV: number | null;
  maxOutputPowerW: number | null;
  productWarranty: string | null;
  unitCost: number | null;
  unitPrice: number | null;
  published: boolean;
  source: string;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const batterySchema = new Schema<IBattery>(
  {
    sku: { type: String, required: true, unique: true, trim: true, index: true },
    objectId: { type: String, required: true, trim: true, index: true },
    brand: { type: String, required: true, trim: true, index: true },
    brandLogo: { type: String, default: null },
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true, index: true },
    photo: { type: String, default: null },
    datasheet: { type: String, default: null },
    capacityKwh: { type: Number, required: true, index: true },
    usableKwh: { type: Number, required: true },
    depthOfDischarge: { type: Number, default: null },
    roundTripEfficiency: { type: Number, default: null },
    lengthMm: { type: Number, default: null },
    widthMm: { type: Number, default: null },
    heightMm: { type: Number, default: null },
    weightKg: { type: Number, default: null },
    chemistry: { type: String, default: null },
    ratedDcVoltageV: { type: Number, default: null },
    maxOutputPowerW: { type: Number, default: null },
    productWarranty: { type: String, default: null },
    unitCost: { type: Number, default: null },
    unitPrice: { type: Number, default: null },
    published: { type: Boolean, default: true, index: true },
    source: { type: String, default: 'greensketch', trim: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: COLLECTIONS.BATTERIES },
);

batterySchema.index({ brand: 1, capacityKwh: -1 });
batterySchema.index({ brand: 1, code: 1 });

export type BatteryDocument = HydratedDocument<IBattery>;
export type BatteryModel = Model<IBattery>;

export const Battery = model<IBattery>('Battery', batterySchema);
