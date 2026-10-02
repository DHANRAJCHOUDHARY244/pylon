import pino from 'pino';
import pretty from 'pino-pretty';

import { env } from '../config/index.js';

const options: pino.LoggerOptions = {
  level: env.LOG_LEVEL,
};

export const logger =
  env.NODE_ENV === 'development'
    ? pino(
        options,
        pretty({
          colorize: true,
          translateTime: 'HH:MM:ss',
          ignore: 'pid,hostname,reqId,responseTime',
          singleLine: true,
        }),
      )
    : pino(options);
