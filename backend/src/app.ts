import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';

import { env } from './config/index.js';
import { logger } from './helpers/logger.js';
import { errorHandler, notFoundHandler } from './middleware/index.js';
import routes from './routes/index.js';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(
    pinoHttp({
      logger,
      autoLogging: env.NODE_ENV !== 'test',
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
