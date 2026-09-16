import mongoose from 'mongoose';

import { env } from './index.js';
import { logger } from '../helpers/logger.js';

export async function connectDatabase(): Promise<typeof mongoose> {
  mongoose.set('strictQuery', true);

  mongoose.connection.on('connected', () => {
    logger.info('MongoDB connected');
  });

  mongoose.connection.on('error', (error) => {
    logger.error({ err: error }, 'MongoDB connection error');
  });

  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected');
  });

  return mongoose.connect(env.MONGODB_URI);
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.connection.close();
  logger.info('MongoDB disconnected gracefully');
}
