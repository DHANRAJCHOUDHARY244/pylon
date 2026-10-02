import type { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import { ZodError } from 'zod';

import { appConfig } from '../config/index.js';
import { HTTP_STATUS, MESSAGES } from '../constants/index.js';
import { logger } from '../helpers/logger.js';
import type { ApiError } from '../types/index.js';
import { AppError } from '../utils/errors.js';

export function notFoundHandler(_req: Request, _res: Response, next: NextFunction): void {
  next(new AppError(MESSAGES.NOT_FOUND, HTTP_STATUS.NOT_FOUND));
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  let statusCode: number = HTTP_STATUS.INTERNAL_ERROR;
  let message: string = MESSAGES.INTERNAL_ERROR;
  let errors: unknown;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    errors = err.errors;
  } else if (err instanceof ZodError) {
    statusCode = HTTP_STATUS.UNPROCESSABLE;
    message = MESSAGES.VALIDATION_ERROR;
    errors = err.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
    }));
  } else if (err instanceof mongoose.Error.ValidationError) {
    statusCode = HTTP_STATUS.UNPROCESSABLE;
    message = MESSAGES.VALIDATION_ERROR;
    errors = Object.values(err.errors).map((e) => e.message);
  } else if (err instanceof mongoose.Error.CastError) {
    statusCode = HTTP_STATUS.BAD_REQUEST;
    message = 'Invalid resource id';
  } else if (err && typeof err === 'object' && 'code' in err && err.code === 11000) {
    statusCode = HTTP_STATUS.CONFLICT;
    message = 'Duplicate key error';
  }

  if (statusCode >= 500) {
    logger.error({ err }, message);
  }

  const body: ApiError & { stack?: string } = {
    success: false,
    message,
  };

  if (errors !== undefined) {
    body.errors = errors;
  }

  if (appConfig.isDev && err instanceof Error && err.stack && statusCode >= 500) {
    body.stack = err.stack;
  }

  res.status(statusCode).json(body);
}
