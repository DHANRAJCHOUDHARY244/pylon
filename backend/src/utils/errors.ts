import { HTTP_STATUS } from '../constants/index.js';

export class AppError extends Error {
  readonly statusCode: number;
  readonly isOperational: boolean;
  readonly errors?: unknown;

  constructor(
    message: string,
    statusCode: number = HTTP_STATUS.INTERNAL_ERROR,
    errors?: unknown,
    isOperational = true,
  ) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    if (errors !== undefined) {
      this.errors = errors;
    }
    Error.captureStackTrace?.(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, HTTP_STATUS.NOT_FOUND);
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, HTTP_STATUS.UNAUTHORIZED);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, HTTP_STATUS.FORBIDDEN);
    this.name = 'ForbiddenError';
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation failed', errors?: unknown) {
    super(message, HTTP_STATUS.UNPROCESSABLE, errors);
    this.name = 'ValidationError';
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflict') {
    super(message, HTTP_STATUS.CONFLICT);
    this.name = 'ConflictError';
  }
}
