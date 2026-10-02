import type { Server as HttpServer } from 'node:http';

import { Server } from 'socket.io';

import { env } from './config/index.js';
import { logger } from './helpers/logger.js';

let io: Server | null = null;

export function initSocket(httpServer: HttpServer): Server {
  const origins = env.CORS_ORIGIN.split(',')
    .map((v) => v.trim())
    .filter(Boolean);

  io = new Server(httpServer, {
    cors: {
      origin(origin, callback) {
        if (!origin) {
          callback(null, true);
          return;
        }
        if (origins.includes(origin)) {
          callback(null, true);
          return;
        }
        const localDev =
          env.NODE_ENV === 'development' &&
          /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
        callback(null, localDev);
      },
      credentials: true,
    },
    path: '/socket.io',
  });

  io.on('connection', (socket) => {
    const userId = String(socket.handshake.auth?.userId ?? '');
    if (userId) {
      void socket.join(`user:${userId}`);
      logger.info({ userId, sid: socket.id }, 'socket joined user room');
    }

    socket.on('join:project', (projectId: string) => {
      if (projectId) void socket.join(`project:${projectId}`);
    });

    socket.on('disconnect', () => {
      /* no-op */
    });
  });

  logger.info('Socket.io ready');
  return io;
}

export function getIO(): Server | null {
  return io;
}

export function emitToUser(userId: string, event: string, payload: unknown) {
  getIO()?.to(`user:${userId}`).emit(event, payload);
}

export function emitToProject(projectId: string, event: string, payload: unknown) {
  getIO()?.to(`project:${projectId}`).emit(event, payload);
}
