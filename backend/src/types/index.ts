import type { Request } from 'express';
import type { HydratedDocument } from 'mongoose';

export type ApiSuccess<T> = {
  success: true;
  message: string;
  data: T;
};

export type ApiError = {
  success: false;
  message: string;
  errors?: unknown;
  stack?: string;
};

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export type JwtPayload = {
  sub: string;
  email: string;
  role: string;
};

export type AuthUser = {
  id: string;
  email: string;
  role: string;
};

export type AuthenticatedRequest = Request & {
  user?: AuthUser;
};

export type BaseEntity = {
  id: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
};

export type DocumentWithId<T> = HydratedDocument<T>;

export type PaginationQuery = {
  page?: number;
  limit?: number;
};

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type PaginatedResult<T> = {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type ServiceResult<T> = Promise<T>;

export type BaseListOptions<TEntity> = {
  filter?: Partial<TEntity>;
  skip?: number;
  limit?: number;
  sort?: Record<string, 1 | -1>;
};

export interface BaseRepositoryContract<TEntity, TCreateInput, TUpdateInput = Partial<TCreateInput>> {
  create(data: TCreateInput): Promise<DocumentWithId<TEntity>>;
  findById(id: string): Promise<DocumentWithId<TEntity> | null>;
  findOne(filter: Partial<TEntity>): Promise<DocumentWithId<TEntity> | null>;
  findMany(options?: BaseListOptions<TEntity>): Promise<DocumentWithId<TEntity>[]>;
  count(filter?: Partial<TEntity>): Promise<number>;
  updateById(id: string, data: TUpdateInput): Promise<DocumentWithId<TEntity> | null>;
  deleteById(id: string): Promise<DocumentWithId<TEntity> | null>;
}
