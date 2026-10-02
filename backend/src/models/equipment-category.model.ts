import { Schema, model, type HydratedDocument, type Model } from 'mongoose';

import { COLLECTIONS } from '../constants/index.js';
import type { EquipmentKindScope } from './equipment-brand.model.js';

export interface IEquipmentCategory {
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  kind: EquipmentKindScope;
  /** Optional mapping keys used when syncing equipment → category */
  mapKeys: string[];
  sortOrder: number;
  productCount: number;
  published: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const equipmentCategorySchema = new Schema<IEquipmentCategory>(
  {
    slug: { type: String, required: true, unique: true, trim: true, index: true },
    name: { type: String, required: true, trim: true, index: true },
    description: { type: String, default: null },
    icon: { type: String, default: null },
    kind: {
      type: String,
      enum: ['panel', 'inverter', 'battery', 'all'],
      required: true,
      index: true,
    },
    mapKeys: { type: [String], default: [] },
    sortOrder: { type: Number, default: 0 },
    productCount: { type: Number, default: 0 },
    published: { type: Boolean, default: true, index: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: COLLECTIONS.EQUIPMENT_CATEGORIES },
);

equipmentCategorySchema.index({ kind: 1, sortOrder: 1 });

export type EquipmentCategoryDocument = HydratedDocument<IEquipmentCategory>;
export type EquipmentCategoryModel = Model<IEquipmentCategory>;

export const EquipmentCategory = model<IEquipmentCategory>(
  'EquipmentCategory',
  equipmentCategorySchema,
);
