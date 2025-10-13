// ==========================================
// AUTHENTICATION CONTROLLER
// ==========================================

import { Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { getPrisma } from '../config/database';
import { config } from '../config';
import { asyncHandler, AppError } from '../middleware/error.middleware';
import { AuthRequest } from '../middleware/auth.middleware';

// ==========================================
// VALIDATION SCHEMAS
// ==========================================

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['ADMIN', 'E_SUPERVISOR', 'M_SUPERVISOR', 'MECHANIKER', 'ELEKTRIKER', 'RSC']),
});

const refreshTokenSchema = z.object({
  refreshToken: z.string(),
});

// ==========================================
// JWT TOKEN GENERATION
// ==========================================

function generateAccessToken(userId: number, email: string, role: string): string {
  return jwt.sign(
    { userId, email, role },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
}

function generateRefreshToken(userId: number): string {
  return jwt.sign(
    { userId },
    config.jwtRefreshSecret,
    { expiresIn: config.jwtRefreshExpiresIn }
  );
}

// ==========================================
// LOGIN
// ==========================================

export const login = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { email, password } = loginSchema.parse(req.body);

  const prisma = getPrisma();

  // Find user
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new AppError(401, 'Invalid credentials');
  }

  // Check if user is active
  if (user.status !== 'ACTIVE') {
    throw new AppError(403, 'User account is inactive');
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw new AppError(401, 'Invalid credentials');
  }

  // Generate tokens
  const accessToken = generateAccessToken(user.id, user.email, user.role);
  const refreshToken = generateRefreshToken(user.id);

  // Save refresh token to database
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt,
    },
  });

  // Return user data and tokens
  res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
    },
    accessToken,
    refreshToken,
  });
});

// ==========================================
// REGISTER (Admin only)
// ==========================================

export const register = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { name, email, password, role } = registerSchema.parse(req.body);

  const prisma = getPrisma();

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new AppError(409, 'User already exists');
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create user
  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role,
      status: 'ACTIVE',
    },
  });

  res.status(201).json({
    message: 'User created successfully',
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
    },
  });
});

// ==========================================
// REFRESH TOKEN
// ==========================================

export const refresh = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { refreshToken } = refreshTokenSchema.parse(req.body);

  const prisma = getPrisma();

  // Verify refresh token
  let decoded: { userId: number };
  try {
    decoded = jwt.verify(refreshToken, config.jwtRefreshSecret) as { userId: number };
  } catch (error) {
    throw new AppError(401, 'Invalid refresh token');
  }

  // Check if refresh token exists in database
  const storedToken = await prisma.refreshToken.findUnique({
    where: { token: refreshToken },
    include: { user: true },
  });

  if (!storedToken || storedToken.expiresAt < new Date()) {
    throw new AppError(401, 'Invalid or expired refresh token');
  }

  // Check if user is still active
  if (storedToken.user.status !== 'ACTIVE') {
    throw new AppError(403, 'User account is inactive');
  }

  // Generate new access token
  const accessToken = generateAccessToken(
    storedToken.user.id,
    storedToken.user.email,
    storedToken.user.role
  );

  res.json({
    accessToken,
  });
});

// ==========================================
// LOGOUT
// ==========================================

export const logout = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { refreshToken } = refreshTokenSchema.parse(req.body);

  const prisma = getPrisma();

  // Delete refresh token from database
  await prisma.refreshToken.deleteMany({
    where: { token: refreshToken },
  });

  res.json({ message: 'Logged out successfully' });
});

// ==========================================
// GET CURRENT USER
// ==========================================

export const getCurrentUser = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new AppError(401, 'Not authenticated');
  }

  const prisma = getPrisma();

  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw new AppError(404, 'User not found');
  }

  res.json({ user });
});

// ==========================================
// CHANGE PASSWORD
// ==========================================

const changePasswordSchema = z.object({
  oldPassword: z.string(),
  newPassword: z.string().min(6),
});

export const changePassword = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new AppError(401, 'Not authenticated');
  }

  const { oldPassword, newPassword } = changePasswordSchema.parse(req.body);

  const prisma = getPrisma();

  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
  });

  if (!user) {
    throw new AppError(404, 'User not found');
  }

  // Verify old password
  const isPasswordValid = await bcrypt.compare(oldPassword, user.password);

  if (!isPasswordValid) {
    throw new AppError(401, 'Invalid old password');
  }

  // Hash new password
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  // Update password
  await prisma.user.update({
    where: { id: req.user.id },
    data: { password: hashedPassword },
  });

  // Invalidate all refresh tokens
  await prisma.refreshToken.deleteMany({
    where: { userId: req.user.id },
  });

  res.json({ message: 'Password changed successfully' });
});