import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import prisma from '../config/db.js';
import { authenticateJWT, AuthRequest } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { validateBody } from '../middleware/validate.js';

const router = Router();

// Validation Schemas
const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  fullName: z.string().min(2, 'Full name is required'),
  department: z.string().optional().default('Logistics'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const updateRoleSchema = z.object({
  role: z.enum(['ADMIN', 'MANAGER', 'STAFF']),
});

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user (Defaults to lowest-privilege STAFF role)
 *     tags: [Auth]
 */
router.post('/register', validateBody(registerSchema), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { email, password, fullName, department } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(409).json({ success: false, message: 'An account with this email already exists.' });
      return;
    }

    // Default to STAFF role on self-registration
    let staffRole = await prisma.role.findUnique({ where: { name: 'STAFF' } });
    if (!staffRole) {
      staffRole = await prisma.role.create({
        data: { name: 'STAFF', description: 'Standard operational staff' },
      });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await prisma.user.create({
      data: {
        email,
        passwordHash,
        fullName,
        department,
        roleId: staffRole.id,
      },
      include: { role: true },
    });

    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role.name },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully with default role STAFF.',
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        fullName: newUser.fullName,
        role: newUser.role.name,
        department: newUser.department,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: 'Server error during registration' });
  }
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: User login (returns JWT token and user info)
 *     tags: [Auth]
 */
router.post('/login', validateBody(loginSchema), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
      include: { role: true },
    });

    if (!user) {
      res.status(401).json({ success: false, message: 'Invalid email or password' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ success: false, message: 'Invalid email or password' });
      return;
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role.name },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role.name,
        department: user.department,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
});

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current authenticated user profile and active role
 *     security:
 *       - bearerAuth: []
 *     tags: [Auth]
 */
router.get('/me', authenticateJWT, async (req: AuthRequest, res: Response): Promise<void> => {
  res.json({
    success: true,
    user: req.user,
  });
});

/**
 * @swagger
 * /api/auth/users:
 *   get:
 *     summary: List all users (ADMIN only)
 *     security:
 *       - bearerAuth: []
 *     tags: [Auth]
 */
router.get('/users', authenticateJWT, requireRole(['ADMIN']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        fullName: true,
        department: true,
        createdAt: true,
        role: { select: { name: true, description: true } },
      },
      orderBy: { id: 'asc' },
    });

    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to retrieve users' });
  }
});

/**
 * @swagger
 * /api/auth/users/{id}/role:
 *   patch:
 *     summary: Promote or change a user's role (ADMIN only)
 *     security:
 *       - bearerAuth: []
 *     tags: [Auth]
 */
router.patch(
  '/users/:id/role',
  authenticateJWT,
  requireRole(['ADMIN']),
  validateBody(updateRoleSchema),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const targetUserId = parseInt(req.params.id, 10);
      const { role: newRoleName } = req.body;

      const targetRole = await prisma.role.findUnique({ where: { name: newRoleName } });
      if (!targetRole) {
        res.status(400).json({ success: false, message: 'Invalid role specified' });
        return;
      }

      const existingUser = await prisma.user.findUnique({
        where: { id: targetUserId },
        include: { role: true },
      });

      if (!existingUser) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      const updatedUser = await prisma.user.update({
        where: { id: targetUserId },
        data: { roleId: targetRole.id },
        include: { role: true },
      });

      // Audit log entry
      await prisma.auditLog.create({
        data: {
          userId: req.user!.id,
          action: 'PROMOTE_USER_ROLE',
          tableName: 'users',
          recordId: targetUserId,
          oldData: { role: existingUser.role.name },
          newData: { role: newRoleName },
        },
      });

      res.json({
        success: true,
        message: `User ${updatedUser.fullName} promoted to ${newRoleName}`,
        data: {
          id: updatedUser.id,
          fullName: updatedUser.fullName,
          email: updatedUser.email,
          role: updatedUser.role.name,
        },
      });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to update user role' });
    }
  }
);

export default router;

