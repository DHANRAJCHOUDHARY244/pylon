import { BaseRepository } from '../base/base.repository.js';
import { User, type IUser, type UserDocument } from '../models/user.model.js';

export type CreateUserInput = {
  name: string;
  email: string;
  password: string;
  role?: 'user' | 'admin';
};

export type UpdateUserInput = Partial<Pick<IUser, 'name' | 'role' | 'isActive'>>;

export class UserRepository extends BaseRepository<IUser, CreateUserInput, UpdateUserInput> {
  constructor() {
    super(User);
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.findOne({ email: email.toLowerCase() });
  }

  async findByEmailWithPassword(email: string): Promise<UserDocument | null> {
    return User.findOne({ email: email.toLowerCase() }).select('+password');
  }
}

export const userRepository = new UserRepository();
