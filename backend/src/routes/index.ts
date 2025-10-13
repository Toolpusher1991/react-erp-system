// ==========================================
// ROUTES SETUP
// ==========================================

import { Express } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import assetRoutes from './asset.routes';
import workOrderRoutes from './workOrder.routes';
import commentRoutes from './comment.routes';
import notificationRoutes from './notification.routes';
import sapRoutes from './sap.routes';

export function setupRoutes(app: Express): void {
  const API_PREFIX = '/api';

  // Authentication routes
  app.use(`${API_PREFIX}/auth`, authRoutes);

  // Resource routes
  app.use(`${API_PREFIX}/users`, userRoutes);
  app.use(`${API_PREFIX}/assets`, assetRoutes);
  app.use(`${API_PREFIX}/work-orders`, workOrderRoutes);
  app.use(`${API_PREFIX}/comments`, commentRoutes);
  app.use(`${API_PREFIX}/notifications`, notificationRoutes);
  app.use(`${API_PREFIX}/sap`, sapRoutes);

  // 404 handler
  app.use(`${API_PREFIX}/*`, (req, res) => {
    res.status(404).json({ error: 'Route not found' });
  });
}