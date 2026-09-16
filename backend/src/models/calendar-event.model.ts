import { Schema, Types, model, type HydratedDocument, type Model } from 'mongoose';

import {
  CALENDAR_EVENT_SOURCES,
  COLLECTIONS,
  type CalendarEventSource,
} from '../constants/index.js';

export interface ICalendarEvent {
  title: string;
  startsAt: Date;
  endsAt: Date;
  allDay: boolean;
  location?: string;
  notes?: string;
  dealId?: Types.ObjectId | null;
  leadId?: Types.ObjectId | null;
  source: CalendarEventSource;
  externalId?: string | null;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const calendarEventSchema = new Schema<ICalendarEvent>(
  {
    title: { type: String, required: true, trim: true, maxlength: 240 },
    startsAt: { type: Date, required: true, index: true },
    endsAt: { type: Date, required: true },
    allDay: { type: Boolean, default: false },
    location: { type: String, trim: true, maxlength: 320 },
    notes: { type: String, trim: true, maxlength: 4000 },
    dealId: { type: Schema.Types.ObjectId, ref: 'Deal', default: null },
    leadId: { type: Schema.Types.ObjectId, ref: 'Lead', default: null },
    source: { type: String, enum: CALENDAR_EVENT_SOURCES, default: 'local', index: true },
    externalId: { type: String, default: null, maxlength: 256 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  },
  {
    timestamps: true,
    collection: COLLECTIONS.CALENDAR_EVENTS,
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

calendarEventSchema.index(
  { createdBy: 1, source: 1, externalId: 1 },
  { unique: true, partialFilterExpression: { externalId: { $type: 'string' } } },
);

export type CalendarEventDocument = HydratedDocument<ICalendarEvent>;
export type CalendarEventModel = Model<ICalendarEvent>;
export const CalendarEvent = model<ICalendarEvent>('CalendarEvent', calendarEventSchema);
