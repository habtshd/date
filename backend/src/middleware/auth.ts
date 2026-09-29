import { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { prisma } from '../plugins/prisma';
import { UserSessionPayload } from '../types';

export async function authenticate(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const authHeader = request.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    reply.status(401).send({
      success: false,
      message: 'Authentication required. Missing Bearer token.',
    });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as { userId: string };

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        phoneNumber: true,
        accountStatus: true,
        verificationStatus: true,
      },
    });

    if (!user) {
      reply.status(401).send({ success: false, message: 'User account not found' });
      return;
    }

    if (user.accountStatus === 'BANNED' || user.accountStatus === 'DELETED') {
      reply.status(403).send({ success: false, message: 'Account is restricted or banned' });
      return;
    }

    request.user = {
      userId: user.id,
      phoneNumber: user.phoneNumber,
      accountStatus: user.accountStatus,
      verificationStatus: user.verificationStatus,
    } as UserSessionPayload;
  } catch {
    reply.status(401).send({ success: false, message: 'Invalid or expired access token' });
  }
}
