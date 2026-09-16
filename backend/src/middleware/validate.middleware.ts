import type { NextFunction, Request, Response } from 'express';
import type { ZodType } from 'zod';

import { ValidationError } from '../utils/errors.js';

type RequestPart = 'body' | 'query' | 'params';

export function validate(schema: ZodType, part: RequestPart = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[part]);

    if (!result.success) {
      next(
        new ValidationError(
          'Validation failed',
          result.error.issues.map((issue) => ({
            path: issue.path.join('.'),
            message: issue.message,
          })),
        ),
      );
      return;
    }

    (req as Request & Record<RequestPart, unknown>)[part] = result.data;
    next();
  };
}
