import { Schema, Types, model, type HydratedDocument, type Model } from 'mongoose';

import { COLLECTIONS } from '../constants/index.js';

export interface ISite {
  projectId: Types.ObjectId;
  address: string;
  lat: number;
  lng: number;
  createdAt: Date;
  updatedAt: Date;
}

const siteSchema = new Schema<ISite>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, unique: true, index: true },
    address: { type: String, required: true, trim: true, maxlength: 400 },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  {
    timestamps: true,
    collection: COLLECTIONS.SITES,
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

export type SiteDocument = HydratedDocument<ISite>;
export type SiteModel = Model<ISite>;

export const Site = model<ISite>('Site', siteSchema);
