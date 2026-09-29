import { FastifyReply, FastifyRequest } from 'fastify';
import { prisma } from '../plugins/prisma';

export async function requireVerified(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const userId = request.user?.userId || (request.user as any)?.sub;

  if (!userId) {
    reply.status(401).send({
      success: false,
      error: 'USER_NOT_FOUND',
      message: 'Authentication required',
    });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      accountStatus: true,
      phoneVerified: true,
      verificationStatus: true,
    },
  });

  if (!user) {
    reply.status(401).send({
      success: false,
      error: 'USER_NOT_FOUND',
      message: 'User account not found',
    });
    return;
  }

  if (user.accountStatus !== 'ACTIVE') {
    reply.status(403).send({
      success: false,
      error: 'ACCOUNT_NOT_ACTIVE',
      message: 'User account is suspended, banned, or deactivated',
    });
    return;
  }

  if (!user.phoneVerified) {
    reply.status(403).send({
      success: false,
      error: 'PHONE_NOT_VERIFIED',
      message: 'Phone number verification required before identity verification',
    });
    return;
  }

  if (user.verificationStatus !== 'VERIFIED') {
    reply.status(403).send({
      success: false,
      error: 'IDENTITY_VERIFICATION_REQUIRED',
      message: 'Identity verification required to access dating discovery',
    });
    return;
  }
}
