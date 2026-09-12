import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../config/db.js';

export interface AuthenticatedUser {
  id: number;
  email: string;
  fullName: string;
  role: string;
  department?: string | null;
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
}

export const authenticateJWT = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      message: 'Access denied. No authentication token provided.',
    });
    return;
  }

  const token = authHeader.split(' ')[1];
  const secret = process.env.JWT_SECRET || 'fallback_secret';

  try {
    const decoded = jwt.verify(token, secret) as {
      id: number;
      email: string;
      role: string;
    };

    // Hydrate user from DB to guarantee current role and active state
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: { role: true },
    });

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid token: User no longer exists.',
      });
      return;
    }

    req.user = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role.name,
      department: user.department,
    };

    next();
  } catch (err) {
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token.',
    });
  }
};

