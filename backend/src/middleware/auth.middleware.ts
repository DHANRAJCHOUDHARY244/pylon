import type { NextFunction, Response } from 'express';

import { AUTH } from '../constants/index.js';
import { verifyToken } from '../helpers/crypto.js';
import type { AuthenticatedRequest } from '../types/index.js';
import { ForbiddenError, UnauthorizedError } from '../utils/errors.js';

export function authenticate(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction,
): void {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith(AUTH.BEARER_PREFIX)) {
      throw new UnauthorizedError('Missing or invalid authorization header');
    }

    const token = header.slice(AUTH.BEARER_PREFIX.length);
    const payload = verifyToken(token);

    req.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role === 'admin' ? 'admin' : 'user',
    };

    next();
  } catch {
    next(new UnauthorizedError('Invalid or expired token'));
  }
}

/** Restrict sensitive routes (user directory, workspace branding writes). */
export function requireAdmin(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction,
): void {
  if (!req.user) {
    next(new UnauthorizedError('Authentication required'));
    return;
  }
  if (req.user.role !== 'admin') {
    next(new ForbiddenError('Admin access required'));
    return;
  }
  next();
}
