import { Schema, model, type HydratedDocument, type Model } from 'mongoose';

import { COLLECTIONS } from '../constants/index.js';

export type EquipmentKindScope = 'panel' | 'inverter' | 'battery' | 'all';

export interface IEquipmentBrand {
  slug: string;
  name: string;
  logoUrl: string | null;
  website: string | null;
  country: string | null;
  notes: string | null;
  /** Which catalogs this brand appears in */
  kinds: EquipmentKindScope[];
  /** Counts last synced from equipment collections */
  panelCount: number;
  inverterCount: number;
  batteryCount: number;
  published: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const equipmentBrandSchema = new Schema<IEquipmentBrand>(
  {
    slug: { type: String, required: true, unique: true, trim: true, index: true },
    name: { type: String, required: true, trim: true, index: true },
    logoUrl: { type: String, default: null },
    website: { type: String, default: null },
    country: { type: String, default: null },
    notes: { type: String, default: null },
    kinds: {
      type: [String],
      enum: ['panel', 'inverter', 'battery', 'all'],
      default: ['all'],
    },
    panelCount: { type: Number, default: 0 },
    inverterCount: { type: Number, default: 0 },
    batteryCount: { type: Number, default: 0 },
    published: { type: Boolean, default: true, index: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: COLLECTIONS.EQUIPMENT_BRANDS },
);

equipmentBrandSchema.index({ name: 1 });

export type EquipmentBrandDocument = HydratedDocument<IEquipmentBrand>;
export type EquipmentBrandModel = Model<IEquipmentBrand>;

export const EquipmentBrand = model<IEquipmentBrand>('EquipmentBrand', equipmentBrandSchema);
