import { Schema, Types, model, type HydratedDocument, type Model } from 'mongoose';

import { CALENDAR_PROVIDERS, COLLECTIONS, type CalendarProvider } from '../constants/index.js';

export interface ICalendarConnection {
  provider: CalendarProvider;
  email?: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date | null;
  scope?: string;
  lastSyncedAt?: Date | null;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const calendarConnectionSchema = new Schema<ICalendarConnection>(
  {
    provider: { type: String, enum: CALENDAR_PROVIDERS, required: true },
    email: { type: String, trim: true, lowercase: true, maxlength: 200 },
    accessToken: { type: String, required: true },
    refreshToken: { type: String },
    expiresAt: { type: Date, default: null },
    scope: { type: String, maxlength: 500 },
    lastSyncedAt: { type: Date, default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  },
  {
    timestamps: true,
    collection: COLLECTIONS.CALENDAR_CONNECTIONS,
    toJSON: {
      virtuals: true,
      transform(_doc, ret) {
        const raw = ret as Record<string, unknown>;
        const id = String(raw['_id']);
        delete raw['_id'];
        delete raw['__v'];
        delete raw['accessToken'];
        delete raw['refreshToken'];
        return { id, ...raw };
      },
    },
  },
);

calendarConnectionSchema.index({ createdBy: 1, provider: 1 }, { unique: true });

export type CalendarConnectionDocument = HydratedDocument<ICalendarConnection>;
export type CalendarConnectionModel = Model<ICalendarConnection>;
export const CalendarConnection = model<ICalendarConnection>(
  'CalendarConnection',
  calendarConnectionSchema,
);
