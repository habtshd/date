import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { UnauthorizedError, ForbiddenError } from '../common/errors';
import { prisma } from '../database/prisma';
import { AuthenticatedUser } from '../types/express';

interface JwtPayload {
  userId: string;
  phone: string;
}

export async function requireAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Authentication token missing or invalid format');
    }

    const token = authHeader.split(' ')[1];
    let payload: JwtPayload;

    try {
      payload = jwt.verify(token, config.jwt.accessSecret) as JwtPayload;
    } catch {
      throw new UnauthorizedError('Token expired or invalid');
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, phone: true, role: true, status: true },
    });

    if (!user) {
      throw new UnauthorizedError('User account not found');
    }

    if (user.status === 'BANNED' || user.status === 'DELETED') {
      throw new ForbiddenError('Account is banned or suspended. Contact support.');
    }

    req.user = user as AuthenticatedUser;
    next();
  } catch (error) {
    next(error);
  }
}
