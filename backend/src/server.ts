import { createApp } from './app.js';
import { env } from './config/index.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { logger } from './helpers/logger.js';

async function bootstrap(): Promise<void> {
  await connectDatabase();

  const app = createApp();
  const server = app.listen(env.PORT, () => {
    logger.info(`Server running on http://localhost:${env.PORT} [${env.NODE_ENV}]`);
  });

  const shutdown = async (signal: string) => {
    logger.info(`${signal} received — shutting down`);
    server.close(async () => {
      await disconnectDatabase();
      process.exit(0);
    });
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

bootstrap().catch((error: unknown) => {
  logger.fatal({ err: error }, 'Failed to start server');
  process.exit(1);
});
