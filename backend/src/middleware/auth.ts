// ==========================================
// JWT AUTHENTICATION MIDDLEWARE
// Token validation and user authentication
// ==========================================

import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ==========================================
// TYPE DEFINITIONS
// ==========================================

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
    name: string;
    role: string;
  };
}

export interface JwtPayload {
  userId: number;
  email: string;
  role: string;
  type: 'access' | 'refresh';
}

// ==========================================
// JWT CONFIGURATION
// ==========================================

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '15m';
const JWT_REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '7d';

// ==========================================
// TOKEN GENERATION
// ==========================================

export function generateAccessToken(user: { id: number; email: string; role: string }): string {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
      type: 'access'
    } as JwtPayload,
    JWT_SECRET,
    { expiresIn: JWT_EXPIRY }
  );
}

export function generateRefreshToken(user: { id: number; email: string; role: string }): string {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
      type: 'refresh'
    } as JwtPayload,
    JWT_REFRESH_SECRET,
    { expiresIn: JWT_REFRESH_EXPIRY }
  );
}

export function generateTokenPair(user: { id: number; email: string; role: string }) {
  return {
    token: generateAccessToken(user),
    refreshToken: generateRefreshToken(user)
  };
}

// ==========================================
// TOKEN VERIFICATION
// ==========================================

export function verifyAccessToken(token: string): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    
    if (decoded.type !== 'access') {
      console.log('❌ Invalid token type:', decoded.type);
      return null;
    }
    
    return decoded;
  } catch (error) {
    console.log('❌ Access token verification failed:', error instanceof Error ? error.message : 'Unknown error');
    return null;
  }
}

export function verifyRefreshToken(token: string): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET) as JwtPayload;
    
    if (decoded.type !== 'refresh') {
      console.log('❌ Invalid refresh token type:', decoded.type);
      return null;
    }
    
    return decoded;
  } catch (error) {
    console.log('❌ Refresh token verification failed:', error instanceof Error ? error.message : 'Unknown error');
    return null;
  }
}

// ==========================================
// AUTHENTICATION MIDDLEWARE
// ==========================================

export async function authenticateToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({
        error: 'Access denied',
        message: 'No authentication token provided'
      });
      return;
    }

    const decoded = verifyAccessToken(token);
    
    if (!decoded) {
      res.status(403).json({
        error: 'Invalid token',
        message: 'Authentication token is invalid or expired'
      });
      return;
    }

    // Fetch current user data from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true
      }
    });

    if (!user) {
      res.status(403).json({
        error: 'User not found',
        message: 'The user associated with this token no longer exists'
      });
      return;
    }

    // Add user to request object
    req.user = user;
    next();

  } catch (error) {
    console.error('🔥 Authentication middleware error:', error);
    res.status(500).json({
      error: 'Authentication error',
      message: 'Internal server error during authentication'
    });
  }
}

// ==========================================
// ROLE-BASED ACCESS CONTROL
// ==========================================

export function requireRole(allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'Authentication required',
        message: 'You must be logged in to access this resource'
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: 'Insufficient permissions',
        message: `This action requires one of the following roles: ${allowedRoles.join(', ')}`
      });
      return;
    }

    next();
  };
}

// ==========================================
// OPTIONAL AUTHENTICATION
// ==========================================

export async function optionalAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = verifyAccessToken(token);
      
      if (decoded) {
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          select: {
            id: true,
            email: true,
            name: true,
            role: true
          }
        });

        if (user) {
          req.user = user;
        }
      }
    }

    next();
  } catch (error) {
    console.error('Optional auth error:', error);
    next(); // Continue without authentication
  }
}

console.log('🔐 JWT Authentication middleware loaded');