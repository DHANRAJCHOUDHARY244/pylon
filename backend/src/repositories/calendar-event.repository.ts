import { Types } from 'mongoose';

import { BaseRepository } from '../base/base.repository.js';
import type { CalendarEventSource } from '../constants/index.js';
import {
  CalendarEvent,
  type CalendarEventDocument,
  type ICalendarEvent,
} from '../models/calendar-event.model.js';

export type CreateCalendarEventInput = {
  title: string;
  startsAt: Date | string;
  endsAt: Date | string;
  allDay?: boolean;
  location?: string;
  notes?: string;
  dealId?: Types.ObjectId | string | null;
  leadId?: Types.ObjectId | string | null;
  source?: CalendarEventSource;
  externalId?: string | null;
  createdBy: Types.ObjectId | string;
};

export type UpdateCalendarEventInput = Partial<Omit<CreateCalendarEventInput, 'createdBy'>>;

export class CalendarEventRepository extends BaseRepository<
  ICalendarEvent,
  CreateCalendarEventInput,
  UpdateCalendarEventInput
> {
  constructor() {
    super(CalendarEvent);
  }

  async findByOwnerInRange(
    userId: string,
    from: Date,
    to: Date,
  ): Promise<CalendarEventDocument[]> {
    return this.model
      .find({
        createdBy: userId,
        startsAt: { $lte: to },
        endsAt: { $gte: from },
      })
      .sort({ startsAt: 1 });
  }

  async findByOwner(userId: string, skip: number, limit: number): Promise<CalendarEventDocument[]> {
    return this.model
      .find({ createdBy: userId })
      .sort({ startsAt: 1 })
      .skip(skip)
      .limit(limit);
  }

  async countByOwner(userId: string): Promise<number> {
    return this.model.countDocuments({ createdBy: userId });
  }

  async upsertExternal(
    userId: string,
    source: CalendarEventSource,
    externalId: string,
    data: Omit<CreateCalendarEventInput, 'createdBy' | 'source' | 'externalId'>,
  ): Promise<CalendarEventDocument> {
    const updated = await this.model.findOneAndUpdate(
      { createdBy: userId, source, externalId },
      {
        $set: {
          ...data,
          source,
          externalId,
          createdBy: new Types.ObjectId(userId),
        },
      },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true },
    );
    return updated!;
  }
}

export const calendarEventRepository = new CalendarEventRepository();
