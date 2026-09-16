import { Schema, Types, model, type HydratedDocument, type Model } from 'mongoose';

import { COLLECTIONS } from '../constants/index.js';

export type ProjectStatus = 'draft' | 'sent' | 'signed' | 'won';

export interface IProject {
  title: string;
  status: ProjectStatus;
  customerId: Types.ObjectId;
  inverterCatalogId: string;
  batteryCatalogId: string | null;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const projectSchema = new Schema<IProject>(
  {
    title: { type: String, required: true, trim: true, maxlength: 240 },
    status: {
      type: String,
      enum: ['draft', 'sent', 'signed', 'won'],
      default: 'draft',
    },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
    inverterCatalogId: { type: String, required: true, trim: true },
    batteryCatalogId: { type: String, default: null, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  },
  {
    timestamps: true,
    collection: COLLECTIONS.PROJECTS,
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

export type ProjectDocument = HydratedDocument<IProject>;
export type ProjectModel = Model<IProject>;

export const Project = model<IProject>('Project', projectSchema);
