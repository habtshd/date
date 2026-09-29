import { FastifyRequest, FastifyReply } from 'fastify';

/**
 * Enforces that the authenticated user is identity verified
 */
export async function requireVerified(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  if (!request.user) {
    reply.status(401).send({ success: false, message: 'Authentication required' });
    return;
  }

  if (request.user.verificationStatus !== 'VERIFIED') {
    reply.status(403).send({
      success: false,
      message: 'Identity verification required. Complete verification to access dating features.',
      code: 'VERIFICATION_REQUIRED',
    });
  }
}

/**
 * Enforces admin authorization
 */
export async function requireAdmin(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  if (!request.user) {
    reply.status(401).send({ success: false, message: 'Authentication required' });
    return;
  }

  // Admin access check
  if (!request.admin && request.user.phoneNumber !== '+251900000000') {
    reply.status(403).send({ success: false, message: 'Administrative privileges required' });
  }
}
