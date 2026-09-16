import type { Response } from 'express';

import { MESSAGES } from '../constants/index.js';
import { sendCreated, sendNoContent, sendSuccess } from '../helpers/response.js';

export abstract class BaseController {
  protected ok<T>(res: Response, data: T, message: string = MESSAGES.SUCCESS): Response {
    return sendSuccess(res, data, message);
  }

  protected created<T>(res: Response, data: T, message: string = MESSAGES.CREATED): Response {
    return sendCreated(res, data, message);
  }

  protected noContent(res: Response): Response {
    return sendNoContent(res);
  }
}
