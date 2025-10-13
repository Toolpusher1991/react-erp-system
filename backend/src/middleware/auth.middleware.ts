// ==========================================
// AUTHENTICATION MIDDLEWARE
// ==========================================

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { getPrisma } from '../config/database';
import { UserRole } from '@prisma/client';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: UserRole;
  };
}

// ==========================================
// VERIFY JWT TOKEN
// ==========================================

export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const decoded = jwt.verify(token, config.jwtSecret) as {
      userId: number;
      email: string;
      role: UserRole;
    };

    // Verify user still exists and is active
    const prisma = getPrisma();
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user || user.status !== 'ACTIVE') {
      return res.status(401).json({ error: 'User not found or inactive' });
    }

    req.user = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ error: 'Token expired' });
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    return res.status(500).json({ error: 'Authentication failed' });
  }
};

// ==========================================
// AUTHORIZATION - ROLE-BASED ACCESS CONTROL
// ==========================================

export const authorizeRoles = (...allowedRoles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        required: allowedRoles,
        current: req.user.role,
      });
    }

    next();
  };
};

// ==========================================
// PERMISSION CHECKS
// ==========================================

export const checkPermission = (permission: keyof Permissions) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const permissions = getPermissionsForRole(req.user.role);
    
    if (!permissions[permission]) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        missing: permission,
      });
    }

    next();
  };
};

// ==========================================
// PERMISSIONS MAPPING
// ==========================================

interface Permissions {
  canCreateUser: boolean;
  canEditUser: boolean;
  canDeleteUser: boolean;
  canViewAllUsers: boolean;
  canManageAssets: boolean;
  canCreateTickets: boolean;
  canAssignTickets: boolean;
  canCloseTickets: boolean;
}

function getPermissionsForRole(role: UserRole): Permissions {
  switch (role) {
    case 'ADMIN':
      return {
        canCreateUser: true,
        canEditUser: true,
        canDeleteUser: true,
        canViewAllUsers: true,
        canManageAssets: true,
        canCreateTickets: true,
        canAssignTickets: true,
        canCloseTickets: true,
      };
    
    case 'E_SUPERVISOR':
    case 'M_SUPERVISOR':
      return {
        canCreateUser: false,
        canEditUser: false,
        canDeleteUser: false,
        canViewAllUsers: false,
        canManageAssets: true,
        canCreateTickets: true,
        canAssignTickets: true,
        canCloseTickets: true,
      };
    
    case 'ELEKTRIKER':
    case 'MECHANIKER':
      return {
        canCreateUser: false,
        canEditUser: false,
        canDeleteUser: false,
        canViewAllUsers: false,
        canManageAssets: false,
        canCreateTickets: true,
        canAssignTickets: false,
        canCloseTickets: true,
      };
    
    case 'RSC':
      return {
        canCreateUser: false,
        canEditUser: false,
        canDeleteUser: false,
        canViewAllUsers: false,
        canManageAssets: false,
        canCreateTickets: true,
        canAssignTickets: false,
        canCloseTickets: false,
      };
    
    default:
      return {
        canCreateUser: false,
        canEditUser: false,
        canDeleteUser: false,
        canViewAllUsers: false,
        canManageAssets: false,
        canCreateTickets: false,
        canAssignTickets: false,
        canCloseTickets: false,
      };
  }
}