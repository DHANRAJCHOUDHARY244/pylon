import { Schema, Types, model, type HydratedDocument, type Model } from 'mongoose';

import { COLLECTIONS } from '../constants/index.js';

export type QuoteMessageAuthor = 'customer' | 'staff';

export interface IQuoteMessage {
  projectId: Types.ObjectId;
  signToken?: string | null;
  author: QuoteMessageAuthor;
  authorName: string;
  body: string;
  createdBy?: Types.ObjectId | null;
  readByStaffAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const quoteMessageSchema = new Schema<IQuoteMessage>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    signToken: { type: String, default: null, index: true },
    author: { type: String, enum: ['customer', 'staff'], required: true },
    authorName: { type: String, required: true, trim: true, maxlength: 160 },
    body: { type: String, required: true, trim: true, maxlength: 2000 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    readByStaffAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    collection: COLLECTIONS.QUOTE_MESSAGES,
    toJSON: {
      virtuals: true,
      transform(_doc, ret) {
        const raw = ret as Record<string, unknown>;
        const id = String(raw['_id']);
        delete raw['_id'];
        delete raw['__v'];
        raw.id = id;
        return raw;
      },
    },
  },
);

quoteMessageSchema.index({ projectId: 1, createdAt: 1 });

export type QuoteMessageDocument = HydratedDocument<IQuoteMessage>;
export const QuoteMessage: Model<IQuoteMessage> = model<IQuoteMessage>(
  'QuoteMessage',
  quoteMessageSchema,
);
