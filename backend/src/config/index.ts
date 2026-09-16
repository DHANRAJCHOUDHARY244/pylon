import 'dotenv/config';

import { loadEnv } from './env.js';

export const env = loadEnv();

export const appConfig = {
  name: 'pylon-api',
  version: '1.0.0',
  isDev: env.NODE_ENV === 'development',
  isProd: env.NODE_ENV === 'production',
} as const;
