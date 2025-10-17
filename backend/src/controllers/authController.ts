// ==========================================
// AUTHENTICATION CONTROLLER
// User registration, login, and token management
// ==========================================

import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { 
  generateTokenPair, 
  verifyRefreshToken,
  AuthenticatedRequest 
} from '../middleware/auth.js';

const prisma = new PrismaClient();

// ==========================================
// TYPE DEFINITIONS
// ==========================================

interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  role?: 'ADMIN' | 'M_SUPERVISOR' | 'MECHANIKER' | 'ELEKTRIKER' | 'RSC';
}

interface LoginRequest {
  email: string;
  password: string;
}

interface RefreshTokenRequest {
  refreshToken: string;
}

// ==========================================
// VALIDATION HELPERS
// ==========================================

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validatePassword(password: string): { valid: boolean; message?: string } {
  if (password.length < 6) {
    return { valid: false, message: 'Password must be at least 6 characters long' };
  }
  return { valid: true };
}

// ==========================================
// USER REGISTRATION
// ==========================================

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { email, password, name, role = 'MECHANIKER' }: RegisterRequest = req.body;

    console.log('📝 Registration attempt for:', email);

    // Input validation
    if (!email || !password || !name) {
      res.status(400).json({
        error: 'Missing required fields',
        message: 'Email, password, and name are required'
      });
      return;
    }

    if (!validateEmail(email)) {
      res.status(400).json({
        error: 'Invalid email',
        message: 'Please provide a valid email address'
      });
      return;
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      res.status(400).json({
        error: 'Invalid password',
        message: passwordValidation.message
      });
      return;
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      res.status(409).json({
        error: 'User already exists',
        message: 'An account with this email address already exists'
      });
      return;
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const newUser = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        name: name.trim(),
        role: role
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true
      }
    });

    // Generate tokens
    const tokens = generateTokenPair({
      id: newUser.id,
      email: newUser.email,
      role: newUser.role
    });

    console.log('✅ User registered successfully:', newUser.email);

    res.status(201).json({
      user: newUser,
      token: tokens.token,
      refreshToken: tokens.refreshToken,
      message: 'User registered successfully'
    });

  } catch (error) {
    console.error('🔥 Registration error:', error);
    res.status(500).json({
      error: 'Registration failed',
      message: 'An internal server error occurred during registration'
    });
  }
}

// ==========================================
// USER LOGIN
// ==========================================

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password }: LoginRequest = req.body;

    console.log('🔐 Login attempt for:', email);

    // Input validation
    if (!email || !password) {
      res.status(400).json({
        error: 'Missing credentials',
        message: 'Email and password are required'
      });
      return;
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        password: true,
        createdAt: true
      }
    });

    if (!user) {
      res.status(401).json({
        error: 'Invalid credentials',
        message: 'Invalid email or password'
      });
      return;
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      res.status(401).json({
        error: 'Invalid credentials',
        message: 'Invalid email or password'
      });
      return;
    }

    // Remove password from user object
    const { password: _, ...userWithoutPassword } = user;

    // Generate tokens
    const tokens = generateTokenPair({
      id: userWithoutPassword.id,
      email: userWithoutPassword.email,
      role: userWithoutPassword.role
    });

    // Update last login (optional - you might want to add this field to your schema)
    // await prisma.user.update({
    //   where: { id: user.id },
    //   data: { lastLoginAt: new Date() }
    // });

    console.log('✅ User logged in successfully:', user.email);

    res.json({
      user: userWithoutPassword,
      token: tokens.token,
      refreshToken: tokens.refreshToken,
      message: 'Login successful'
    });

  } catch (error) {
    console.error('🔥 Login error:', error);
    res.status(500).json({
      error: 'Login failed',
      message: 'An internal server error occurred during login'
    });
  }
}

// ==========================================
// TOKEN REFRESH
// ==========================================

export async function refreshToken(req: Request, res: Response): Promise<void> {
  try {
    const { refreshToken }: RefreshTokenRequest = req.body;

    console.log('🔄 Token refresh attempt');

    if (!refreshToken) {
      res.status(400).json({
        error: 'Missing refresh token',
        message: 'Refresh token is required'
      });
      return;
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);
    
    if (!decoded) {
      res.status(403).json({
        error: 'Invalid refresh token',
        message: 'The provided refresh token is invalid or expired'
      });
      return;
    }

    // Fetch current user data
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true
      }
    });

    if (!user) {
      res.status(403).json({
        error: 'User not found',
        message: 'The user associated with this token no longer exists'
      });
      return;
    }

    // Generate new token pair
    const tokens = generateTokenPair({
      id: user.id,
      email: user.email,
      role: user.role
    });

    console.log('✅ Token refreshed successfully for:', user.email);

    res.json({
      user,
      token: tokens.token,
      refreshToken: tokens.refreshToken,
      message: 'Token refreshed successfully'
    });

  } catch (error) {
    console.error('🔥 Token refresh error:', error);
    res.status(500).json({
      error: 'Token refresh failed',
      message: 'An internal server error occurred during token refresh'
    });
  }
}

// ==========================================
// USER LOGOUT
// ==========================================

export async function logout(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;

    console.log('🚪 Logout request for user:', userId);

    // Here you could implement token blacklisting if needed
    // For now, we'll just return a success message
    // The client will remove the token from storage

    res.json({
      message: 'Logout successful'
    });

  } catch (error) {
    console.error('🔥 Logout error:', error);
    res.status(500).json({
      error: 'Logout failed',
      message: 'An internal server error occurred during logout'
    });
  }
}

// ==========================================
// GET CURRENT USER PROFILE
// ==========================================

export async function getProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        error: 'Authentication required',
        message: 'You must be logged in to view your profile'
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: Number(userId) },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true
      }
    });

    if (!user) {
      res.status(404).json({
        error: 'User not found',
        message: 'Your user profile could not be found'
      });
      return;
    }

    res.json({ user });

  } catch (error) {
    console.error('🔥 Get profile error:', error);
    res.status(500).json({
      error: 'Profile fetch failed',
      message: 'An internal server error occurred while fetching your profile'
    });
  }
}

console.log('🔐 Auth Controller loaded');