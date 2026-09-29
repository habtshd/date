import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { UnauthorizedError, ForbiddenError } from '../common/errors';
import { prisma } from '../database/prisma';
import { AuthenticatedAdmin } from '../types/express';

interface AdminJwtPayload {
  adminId: string;
  email: string;
  role: string;
}

export function requireAdmin(_allowedRoles: string[] = ['SUPER_ADMIN', 'ADMIN', 'MODERATOR']) {
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

      // Check if actor user exists and has active account
      const user = await prisma.user.findUnique({
        where: { id: payload.adminId },
        select: { id: true, accountStatus: true },
      });

      if (!user || user.accountStatus === 'BANNED' || user.accountStatus === 'DELETED') {
        throw new ForbiddenError('Admin account inactive or not found');
      }

      req.admin = {
        id: payload.adminId,
        email: payload.email,
        role: payload.role || 'ADMIN',
      } as AuthenticatedAdmin;

      next();
    } catch (error) {
      next(error);
    }
  };
}
