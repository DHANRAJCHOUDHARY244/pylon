import { Schema, Types, model, type HydratedDocument, type Model } from 'mongoose';

import { COLLECTIONS } from '../constants/index.js';

export type NotificationKind =
  | 'proposal_sent'
  | 'proposal_viewed'
  | 'proposal_signed'
  | 'quote_chat'
  | 'quote_updated'
  | 'system';

export interface INotification {
  userId: Types.ObjectId;
  kind: NotificationKind;
  title: string;
  body: string;
  href?: string | null;
  projectId?: Types.ObjectId | null;
  readAt?: Date | null;
  meta?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    kind: {
      type: String,
      enum: [
        'proposal_sent',
        'proposal_viewed',
        'proposal_signed',
        'quote_chat',
        'quote_updated',
        'system',
      ],
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    body: { type: String, required: true, trim: true, maxlength: 800 },
    href: { type: String, default: null, trim: true },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', default: null, index: true },
    readAt: { type: Date, default: null },
    meta: { type: Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: true,
    collection: COLLECTIONS.NOTIFICATIONS,
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

notificationSchema.index({ userId: 1, readAt: 1, createdAt: -1 });

export type NotificationDocument = HydratedDocument<INotification>;
export const Notification: Model<INotification> = model<INotification>(
  'Notification',
  notificationSchema,
);
