import { Schema, model, type HydratedDocument, type Model } from 'mongoose';

import { COLLECTIONS } from '../constants/index.js';

export type UserRole = 'user' | 'admin';

export interface IUser {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
      minlength: 8,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    collection: COLLECTIONS.USERS,
    toJSON: {
      virtuals: true,
      transform(_doc, ret) {
        const raw = ret as Record<string, unknown>;
        const id = String(raw['_id']);
        delete raw['_id'];
        delete raw['__v'];
        delete raw['password'];
        return { id, ...raw };
      },
    },
  },
);

export type UserDocument = HydratedDocument<IUser>;
export type UserModel = Model<IUser>;

export const User = model<IUser>('User', userSchema);
