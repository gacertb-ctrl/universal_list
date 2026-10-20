import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../config/db';

export interface JwtPayload {
  id: number | string;
  roleId: number | string;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    const token = (authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null) || (req.cookies && req.cookies.token);

    if (!token) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid or expired authentication token' });
    return;
  }
};

export const authorize = (roles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Not authenticated' });
        return;
      }
      
      const roleIdInt = typeof req.user.roleId === 'number' ? req.user.roleId : parseInt(String(req.user.roleId), 10);
      const userRole = await prisma.role.findUnique({ where: { id: roleIdInt } });

      if (!userRole || !roles.includes(userRole.name)) {
        res.status(403).json({ success: false, message: 'Forbidden: Insufficient permissions for this action' });
        return;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
