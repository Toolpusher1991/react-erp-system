// ==========================================
// AUTHENTICATION ROUTES
// ==========================================

import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { authenticateToken, authorizeRoles } from '../middleware/auth.middleware';

const router = Router();

// Public routes
router.post('/login', authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);

// Protected routes
router.get('/me', authenticateToken, authController.getCurrentUser);
router.post('/change-password', authenticateToken, authController.changePassword);

// Admin only - register new users
router.post(
  '/register',
  authenticateToken,
  authorizeRoles('ADMIN'),
  authController.register
);

export default router;