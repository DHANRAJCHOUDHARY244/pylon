import { Types } from 'mongoose';

import { BaseRepository } from '../base/base.repository.js';
import {
  CalendarConnection,
  type CalendarConnectionDocument,
  type ICalendarConnection,
} from '../models/calendar-connection.model.js';
import type { CalendarProvider } from '../constants/index.js';

export type CreateCalendarConnectionInput = {
  provider: CalendarProvider;
  email?: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date | null;
  scope?: string;
  lastSyncedAt?: Date | null;
  createdBy: Types.ObjectId | string;
};

export type UpdateCalendarConnectionInput = Partial<
  Omit<CreateCalendarConnectionInput, 'createdBy' | 'provider'>
>;

export class CalendarConnectionRepository extends BaseRepository<
  ICalendarConnection,
  CreateCalendarConnectionInput,
  UpdateCalendarConnectionInput
> {
  constructor() {
    super(CalendarConnection);
  }

  async findByOwner(userId: string): Promise<CalendarConnectionDocument[]> {
    return this.model.find({ createdBy: userId }).sort({ provider: 1 });
  }

  async findByOwnerAndProvider(
    userId: string,
    provider: CalendarProvider,
  ): Promise<CalendarConnectionDocument | null> {
    return this.model.findOne({ createdBy: userId, provider });
  }

  async upsertForOwner(
    userId: string,
    provider: CalendarProvider,
    data: Omit<CreateCalendarConnectionInput, 'createdBy' | 'provider'>,
  ): Promise<CalendarConnectionDocument> {
    const updated = await this.model.findOneAndUpdate(
      { createdBy: userId, provider },
      {
        $set: {
          ...data,
          provider,
          createdBy: new Types.ObjectId(userId),
        },
      },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true },
    );
    return updated!;
  }

  async deleteByOwnerAndProvider(userId: string, provider: CalendarProvider): Promise<boolean> {
    const result = await this.model.deleteOne({ createdBy: userId, provider });
    return result.deletedCount > 0;
  }
}

export const calendarConnectionRepository = new CalendarConnectionRepository();
