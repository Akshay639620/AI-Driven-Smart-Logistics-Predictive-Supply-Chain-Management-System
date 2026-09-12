import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.js';

export const requireRole = (allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized. Please login first.',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: `Forbidden. This action requires one of the following roles: [${allowedRoles.join(
          ', '
        )}]. Your current role is '${req.user.role}'.`,
      });
      return;
    }

    next();
  };
};
