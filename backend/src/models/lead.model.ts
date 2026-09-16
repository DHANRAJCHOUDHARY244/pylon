import { Schema, Types, model, type HydratedDocument, type Model } from 'mongoose';

import { COLLECTIONS, LEAD_STATUSES, type LeadStatus } from '../constants/index.js';

export interface ILead {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  address?: string;
  status: LeadStatus;
  source?: string;
  notes?: string;
  valueAud?: number;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const leadSchema = new Schema<ILead>(
  {
    name: { type: String, required: true, trim: true, maxlength: 160 },
    email: { type: String, trim: true, lowercase: true, maxlength: 200 },
    phone: { type: String, trim: true, maxlength: 40 },
    company: { type: String, trim: true, maxlength: 160 },
    address: { type: String, trim: true, maxlength: 320 },
    status: { type: String, enum: LEAD_STATUSES, default: 'new', index: true },
    source: { type: String, trim: true, maxlength: 80 },
    notes: { type: String, trim: true, maxlength: 4000 },
    valueAud: { type: Number, min: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  },
  {
    timestamps: true,
    collection: COLLECTIONS.LEADS,
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

export type LeadDocument = HydratedDocument<ILead>;
export type LeadModel = Model<ILead>;
export const Lead = model<ILead>('Lead', leadSchema);
