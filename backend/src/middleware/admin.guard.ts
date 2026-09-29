import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { UnauthorizedError, ForbiddenError } from '../common/errors';
import { prisma } from '../database/prisma';
import { AdminRole } from '@prisma/client';
import { AuthenticatedAdmin } from '../types/express';

interface AdminJwtPayload {
  adminId: string;
  email: string;
  role: AdminRole;
}

export function requireAdmin(allowedRoles: AdminRole[] = ['SUPER_ADMIN', 'ADMIN', 'MODERATOR', 'SUPPORT']) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new UnauthorizedError('Admin credentials required');
      }

      const token = authHeader.split(' ')[1];
      let payload: AdminJwtPayload;

      try {
        payload = jwt.verify(token, config.jwt.accessSecret) as AdminJwtPayload;
      } catch {
        throw new UnauthorizedError('Admin token expired or invalid');
      }

      const admin = await prisma.adminUser.findUnique({
        where: { id: payload.adminId },
        select: { id: true, email: true, role: true, isActive: true },
      });

      if (!admin || !admin.isActive) {
        throw new ForbiddenError('Admin account inactive or not found');
      }

      if (!allowedRoles.includes(admin.role)) {
        throw new ForbiddenError('Insufficient administrative privileges');
      }

      req.admin = admin as AuthenticatedAdmin;
      next();
    } catch (error) {
      next(error);
    }
  };
}
