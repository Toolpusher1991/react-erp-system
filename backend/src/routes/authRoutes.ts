// ==========================================
// AUTHENTICATION ROUTES
// User login, registration, and token management
// ==========================================

import { Router } from 'express';
import { 
  register, 
  login, 
  refreshToken, 
  logout, 
  getProfile 
} from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// ==========================================
// PUBLIC AUTHENTICATION ROUTES
// ==========================================

// User Registration
router.post('/register', register);

// User Login
router.post('/login', login);

// Token Refresh
router.post('/refresh', refreshToken);

// ==========================================
// PROTECTED AUTHENTICATION ROUTES
// ==========================================

// User Logout (requires authentication)
router.post('/logout', authenticateToken, logout);

// Get Current User Profile
router.get('/profile', authenticateToken, getProfile);

// Health check for auth service
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'Authentication Service',
    timestamp: new Date().toISOString(),
    endpoints: {
      public: [
        'POST /auth/register',
        'POST /auth/login', 
        'POST /auth/refresh',
        'GET /auth/health'
      ],
      protected: [
        'POST /auth/logout',
        'GET /auth/profile'
      ]
    }
  });
});

console.log('🔐 Auth Routes loaded');

export default router;