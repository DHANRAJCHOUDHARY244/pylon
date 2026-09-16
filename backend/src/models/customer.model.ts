import { Schema, Types, model, type HydratedDocument, type Model } from 'mongoose';

import { COLLECTIONS } from '../constants/index.js';

export interface ICustomer {
  name: string;
  email: string;
  phone?: string;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const customerSchema = new Schema<ICustomer>(
  {
    name: { type: String, required: true, trim: true, maxlength: 160 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 200 },
    phone: { type: String, trim: true, maxlength: 40 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  },
  {
    timestamps: true,
    collection: COLLECTIONS.CUSTOMERS,
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

export type CustomerDocument = HydratedDocument<ICustomer>;
export type CustomerModel = Model<ICustomer>;

export const Customer = model<ICustomer>('Customer', customerSchema);
