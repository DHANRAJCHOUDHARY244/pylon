import type { Request, Response } from 'express';

import { BaseController } from '../base/base.controller.js';
import { MESSAGES } from '../constants/index.js';
import { userService } from '../services/user.service.js';
import type { AuthenticatedRequest } from '../types/index.js';
import { asyncHandler } from '../utils/async-handler.js';

export class UserController extends BaseController {
  register = asyncHandler(async (req: Request, res: Response) => {
    const result = await userService.register(req.body);
    return this.created(res, result, MESSAGES.CREATED);
  });

  login = asyncHandler(async (req: Request, res: Response) => {
    const result = await userService.login(req.body);
    return this.ok(res, result, MESSAGES.LOGIN_SUCCESS);
  });

  me = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = await userService.me(req.user!.id);
    return this.ok(res, user);
  });

  updateMe = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = await userService.updateProfile(req.user!.id, req.body);
    return this.ok(res, user, MESSAGES.UPDATED);
  });

  changePassword = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const result = await userService.changePassword(req.user!.id, req.body);
    return this.ok(res, result, MESSAGES.UPDATED);
  });

  list = asyncHandler(async (req: Request, res: Response) => {
    const result = await userService.listUsers({
      page: Number(req.query.page ?? 1),
      limit: Number(req.query.limit ?? 20),
    });
    return this.ok(res, result);
  });
}

export const userController = new UserController();
