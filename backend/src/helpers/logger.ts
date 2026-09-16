import pino from 'pino';

import { env } from '../config/index.js';

const options: pino.LoggerOptions = {
  level: env.LOG_LEVEL,
};

if (env.NODE_ENV === 'development') {
  options.transport = {
    target: 'pino/file',
    options: { destination: 1 },
  };
}

export const logger = pino(options);
