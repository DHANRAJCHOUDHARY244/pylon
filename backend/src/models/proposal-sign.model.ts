import { randomBytes } from 'node:crypto';

import { Schema, Types, model, type HydratedDocument, type Model } from 'mongoose';

import { COLLECTIONS } from '../constants/index.js';

export type SignStep =
  | 'review'
  | 'details'
  | 'accept'
  | 'signature'
  | 'complete';

export interface IProposalSign {
  token: string;
  projectId: Types.ObjectId;
  createdBy: Types.ObjectId;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  status: 'pending' | 'viewed' | 'signed' | 'expired';
  step: SignStep;
  signedAt?: Date | null;
  signerName?: string | null;
  signerEmail?: string | null;
  signatureDataUrl?: string | null;
  acceptedTerms?: boolean;
  quoteSnapshot?: Record<string, unknown> | null;
  viewCount: number;
  lastViewedAt?: Date | null;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

function makeToken() {
  return randomBytes(12).toString('base64url');
}

const proposalSignSchema = new Schema<IProposalSign>(
  {
    token: { type: String, required: true, unique: true, index: true, default: makeToken },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    customerName: { type: String, required: true, trim: true, maxlength: 160 },
    customerEmail: { type: String, required: true, trim: true, lowercase: true, maxlength: 200 },
    customerPhone: { type: String, default: null, trim: true },
    status: {
      type: String,
      enum: ['pending', 'viewed', 'signed', 'expired'],
      default: 'pending',
      index: true,
    },
    step: {
      type: String,
      enum: ['review', 'details', 'accept', 'signature', 'complete'],
      default: 'review',
    },
    signedAt: { type: Date, default: null },
    signerName: { type: String, default: null, trim: true },
    signerEmail: { type: String, default: null, trim: true, lowercase: true },
    signatureDataUrl: { type: String, default: null },
    acceptedTerms: { type: Boolean, default: false },
    quoteSnapshot: { type: Schema.Types.Mixed, default: null },
    viewCount: { type: Number, default: 0, min: 0 },
    lastViewedAt: { type: Date, default: null },
    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 1000 * 60 * 60 * 24 * 14),
    },
  },
  {
    timestamps: true,
    collection: COLLECTIONS.PROPOSAL_SIGNS,
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

export type ProposalSignDocument = HydratedDocument<IProposalSign>;
export const ProposalSign: Model<IProposalSign> = model<IProposalSign>(
  'ProposalSign',
  proposalSignSchema,
);
