import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { pinoHttp } from 'pino-http';

import { env } from './config/index.js';
import { logger } from './helpers/logger.js';
import { errorHandler, notFoundHandler } from './middleware/index.js';
import routes from './routes/index.js';

function ensureUploads() {
  const dir = join(process.cwd(), 'uploads');
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

export function createApp() {
  const app = express();

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  const allowedOrigins = env.CORS_ORIGIN.split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin) {
          callback(null, true);
          return;
        }
        if (allowedOrigins.includes(origin)) {
          callback(null, true);
          return;
        }
        const localDev =
          env.NODE_ENV === 'development' &&
          /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
        callback(null, localDev);
      },
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '12mb' }));
  app.use(express.urlencoded({ extended: true, limit: '12mb' }));

  ensureUploads();
  app.use('/uploads', express.static(join(process.cwd(), 'uploads'), { maxAge: '7d' }));
  app.use(
    pinoHttp({
      logger,
      quietResLogger: true,
      autoLogging:
        env.NODE_ENV === 'test'
          ? false
          : {
              ignore(req) {
                const url = req.url ?? '';
                return url === '/favicon.ico' || url.startsWith('/json/') || url.startsWith('/uploads/');
              },
            },
      customLogLevel(_req, res, err) {
        if (err || res.statusCode >= 500) return 'error';
        if (res.statusCode >= 400) return 'warn';
        return 'info';
      },
      customSuccessMessage(req, res, responseTime) {
        const url = 'originalUrl' in req && req.originalUrl ? req.originalUrl : req.url;
        return `${req.method} ${url} ${res.statusCode} ${Math.round(responseTime)}ms`;
      },
      customErrorMessage(req, res, error) {
        const url = 'originalUrl' in req && req.originalUrl ? req.originalUrl : req.url;
        return `${req.method} ${url} ${res.statusCode} ${error.message}`;
      },
      customSuccessObject() {
        return {};
      },
      customErrorObject() {
        return {};
      },
    }),
  );

  app.get('/', (_req, res) => {
    res.json({
      success: true,
      message: 'Pylon API',
      data: { docs: '/api/v1/health' },
    });
  });

  app.use('/api/v1', routes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
