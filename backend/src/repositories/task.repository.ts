import { Types } from 'mongoose';

import { BaseRepository } from '../base/base.repository.js';
import { Task, type ITask, type TaskDocument } from '../models/task.model.js';

export type CreateTaskInput = {
  title: string;
  status?: ITask['status'];
  dueAt?: Date | string | null;
  notes?: string;
  dealId?: Types.ObjectId | string | null;
  leadId?: Types.ObjectId | string | null;
  createdBy: Types.ObjectId | string;
};

export type UpdateTaskInput = Partial<Omit<CreateTaskInput, 'createdBy'>>;

export class TaskRepository extends BaseRepository<ITask, CreateTaskInput, UpdateTaskInput> {
  constructor() {
    super(Task);
  }

  async findByOwner(userId: string, skip: number, limit: number): Promise<TaskDocument[]> {
    return this.model
      .find({ createdBy: userId })
      .sort({ dueAt: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit);
  }

  async countByOwner(userId: string, filter: Record<string, unknown> = {}): Promise<number> {
    return this.model.countDocuments({ createdBy: userId, ...filter });
  }
}

export const taskRepository = new TaskRepository();
