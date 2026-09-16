import type { Response } from 'express';

import { DEFAULT_PAGINATION_LIMIT, HTTP_STATUS, MESSAGES, PAGINATION } from '../constants/index.js';
import type { ApiSuccess, PaginatedResult } from '../types/index.js';

export function sendSuccess<T>(
  res: Response,
  data: T,
  message: string = MESSAGES.SUCCESS,
  statusCode: number = HTTP_STATUS.OK,
): Response {
  const body: ApiSuccess<T> = {
    success: true,
    message,
    data,
  };
  return res.status(statusCode).json(body);
}

export function sendCreated<T>(
  res: Response,
  data: T,
  message: string = MESSAGES.CREATED,
): Response {
  return sendSuccess(res, data, message, HTTP_STATUS.CREATED);
}

export function sendNoContent(res: Response): Response {
  return res.status(HTTP_STATUS.NO_CONTENT).send();
}

export function getPagination(
  page: number = PAGINATION.DEFAULT_PAGE,
  limit: number = DEFAULT_PAGINATION_LIMIT,
): { page: number; limit: number; skip: number } {
  const safePage = Math.max(PAGINATION.DEFAULT_PAGE, page);
  const safeLimit = Math.min(PAGINATION.MAX_LIMIT, Math.max(1, limit));
  return {
    page: safePage,
    limit: safeLimit,
    skip: (safePage - 1) * safeLimit,
  };
}

export function buildPaginatedResult<T>(
  items: T[],
  page: number,
  limit: number,
  total: number,
): PaginatedResult<T> {
  return {
    items,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit) || 1,
  };
}
