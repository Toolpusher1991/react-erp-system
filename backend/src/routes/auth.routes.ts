// src/routes/auth.routes.ts
import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';

const router = Router();
const authController = new AuthController();

// POST /api/auth/login
router.post('/login', (req, res) => authController.login(req, res));

// GET /api/auth/me
router.get('/me', (req, res) => authController.getCurrentUser(req, res));

export default router;