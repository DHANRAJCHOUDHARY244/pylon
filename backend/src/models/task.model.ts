import { Schema, Types, model, type HydratedDocument, type Model } from 'mongoose';

import { COLLECTIONS, TASK_STATUSES, type TaskStatus } from '../constants/index.js';

export interface ITask {
  title: string;
  status: TaskStatus;
  dueAt?: Date | null;
  notes?: string;
  dealId?: Types.ObjectId | null;
  leadId?: Types.ObjectId | null;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const taskSchema = new Schema<ITask>(
  {
    title: { type: String, required: true, trim: true, maxlength: 240 },
    status: { type: String, enum: TASK_STATUSES, default: 'open', index: true },
    dueAt: { type: Date, default: null, index: true },
    notes: { type: String, trim: true, maxlength: 4000 },
    dealId: { type: Schema.Types.ObjectId, ref: 'Deal', default: null },
    leadId: { type: Schema.Types.ObjectId, ref: 'Lead', default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  },
  {
    timestamps: true,
    collection: COLLECTIONS.TASKS,
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

export type TaskDocument = HydratedDocument<ITask>;
export type TaskModel = Model<ITask>;
export const Task = model<ITask>('Task', taskSchema);
