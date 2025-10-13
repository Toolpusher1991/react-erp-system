// ==========================================
// SOCKET.IO SETUP FOR REAL-TIME NOTIFICATIONS
// ==========================================

import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { logger } from '../utils/logger';
import { UserRole } from '@prisma/client';

interface AuthenticatedSocket extends Socket {
  user?: {
    id: number;
    email: string;
    role: UserRole;
  };
}

let io: SocketIOServer;

export function setupSocketIO(server: HTTPServer): SocketIOServer {
  io = new SocketIOServer(server, {
    cors: {
      origin: config.corsOrigins,
      credentials: true,
    },
  });

  // Authentication middleware for Socket.IO
  io.use((socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error('Authentication error'));
    }

    try {
      const decoded = jwt.verify(token, config.jwtSecret) as {
        userId: number;
        email: string;
        role: UserRole;
      };

      socket.user = {
        id: decoded.userId,
        email: decoded.email,
        role: decoded.role,
      };

      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  // Connection handler
  io.on('connection', (socket: AuthenticatedSocket) => {
    if (!socket.user) return;

    logger.info(`User connected: ${socket.user.email} (ID: ${socket.user.id})`);

    // Join user-specific room for targeted notifications
    socket.join(`user:${socket.user.id}`);

    // Join role-specific room for broadcasts to roles
    socket.join(`role:${socket.user.role}`);

    // Handle disconnection
    socket.on('disconnect', () => {
      logger.info(`User disconnected: ${socket.user?.email}`);
    });

    // Handle custom events
    socket.on('join_workorder', (workOrderId: number) => {
      socket.join(`workorder:${workOrderId}`);
      logger.debug(`User ${socket.user?.id} joined work order ${workOrderId}`);
    });

    socket.on('leave_workorder', (workOrderId: number) => {
      socket.leave(`workorder:${workOrderId}`);
      logger.debug(`User ${socket.user?.id} left work order ${workOrderId}`);
    });
  });

  return io;
}

// ==========================================
// EMIT FUNCTIONS
// ==========================================

export function emitNotification(userId: number, notification: any) {
  if (!io) return;
  io.to(`user:${userId}`).emit('notification', notification);
}

export function emitToWorkOrder(workOrderId: number, event: string, data: any) {
  if (!io) return;
  io.to(`workorder:${workOrderId}`).emit(event, data);
}

export function emitToRole(role: UserRole, event: string, data: any) {
  if (!io) return;
  io.to(`role:${role}`).emit(event, data);
}

export function broadcastToAll(event: string, data: any) {
  if (!io) return;
  io.emit(event, data);
}

export function getIO(): SocketIOServer {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
}