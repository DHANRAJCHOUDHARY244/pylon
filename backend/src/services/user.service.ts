import { BaseService } from '../base/base.service.js';
import { comparePassword, hashPassword, signToken } from '../helpers/crypto.js';
import type { IUser, UserDocument } from '../models/user.model.js';
import { userRepository } from '../repositories/user.repository.js';
import type { BaseEntity, PaginatedResult, PaginationQuery, ServiceResult } from '../types/index.js';
import { ConflictError, NotFoundError, UnauthorizedError } from '../utils/errors.js';

export type UserResponse = BaseEntity & {
  name: string;
  email: string;
  role: string;
  isActive: boolean;
};

export type RegisterInput = {
  name: string;
  email: string;
  password: string;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type AuthResponse = {
  user: UserResponse;
  token: string;
};

export class UserService extends BaseService<IUser, UserResponse, RegisterInput> {
  constructor() {
    super(userRepository);
  }

  protected override getEntityLabel(): string {
    return 'User';
  }

  protected serialize(entity: UserDocument): UserResponse {
    return entity.toJSON() as unknown as UserResponse;
  }

  async register(input: RegisterInput): ServiceResult<AuthResponse> {
    const existing = await userRepository.findByEmail(input.email);
    if (existing) {
      throw new ConflictError('Email already registered');
    }

    const password = await hashPassword(input.password);
    const userCount = await userRepository.count();
    const user = await userRepository.create({
      name: input.name,
      email: input.email,
      password,
      // First account becomes workspace admin (branding + user directory).
      role: userCount === 0 ? 'admin' : 'user',
    });

    return {
      user: this.serialize(user),
      token: signToken({
        sub: String(user._id),
        email: user.email,
        role: user.role ?? 'user',
      }),
    };
  }

  async login(input: LoginInput): ServiceResult<AuthResponse> {
    const user = await userRepository.findByEmailWithPassword(input.email);
    if (!user || !user.isActive) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const valid = await comparePassword(input.password, user.password);
    if (!valid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    return {
      user: this.serialize(user),
      token: signToken({
        sub: String(user._id),
        email: user.email,
        role: user.role ?? 'user',
      }),
    };
  }

  async me(id: string): ServiceResult<UserResponse> {
    return this.getById(id);
  }

  async updateProfile(id: string, input: { name: string }): ServiceResult<UserResponse> {
    const updated = await userRepository.updateById(id, { name: input.name });
    if (!updated) throw new NotFoundError('User');
    return this.serialize(updated);
  }

  async changePassword(
    id: string,
    input: { currentPassword: string; newPassword: string },
  ): ServiceResult<{ ok: true }> {
    const user = await userRepository.findByIdWithPassword(id);
    if (!user || !user.isActive) throw new NotFoundError('User');

    const valid = await comparePassword(input.currentPassword, user.password);
    if (!valid) throw new UnauthorizedError('Current password is incorrect');

    user.password = await hashPassword(input.newPassword);
    await user.save();
    return { ok: true };
  }

  async listUsers(query: PaginationQuery = {}): ServiceResult<PaginatedResult<UserResponse>> {
    return this.list(query);
  }
}

export const userService = new UserService();
