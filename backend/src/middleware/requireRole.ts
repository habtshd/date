import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../plugins/prisma';
import { env } from '../config/env';
import { UserRole } from '@prisma/client';

export function requireRole(...allowedRoles: UserRole[]) {
  return async function (
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    const userId = request.user?.userId || (request.user as any)?.sub;

    if (!userId) {
      reply.status(401).send({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'Authentication required',
      });
      return;
    }

    // Direct admin login token compatibility
    if (request.admin && allowedRoles.includes(UserRole.ADMIN)) {
      return;
    }

    // Fast-path: Check authenticated role from session
    const currentRole = request.user?.role;
    if (currentRole && allowedRoles.includes(currentRole)) {
      return;
    }

    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true, accountStatus: true },
      });

      if (!user || !allowedRoles.includes(user.role)) {
        reply.status(403).send({
          success: false,
          error: 'FORBIDDEN',
          message: 'Insufficient administrative or moderator privileges',
        });
        return;
      }

      if (user.accountStatus !== 'ACTIVE') {
        reply.status(403).send({
          success: false,
          error: 'ACCOUNT_NOT_ACTIVE',
          message: 'Account is restricted or inactive',
        });
        return;
      }
    } catch (dbErr: any) {
      if (
        process.env.NODE_ENV === 'test' ||
        env.NODE_ENV === 'test' ||
        dbErr?.name?.includes('PrismaClient') ||
        dbErr?.message?.includes('database server')
      ) {
        if (!currentRole || !allowedRoles.includes(currentRole)) {
          reply.status(403).send({
            success: false,
            error: 'FORBIDDEN',
            message: 'Insufficient administrative or moderator privileges',
          });
          return;
        }
      } else {
        throw dbErr;
      }
    }
  };
}
