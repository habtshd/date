import { FastifyRequest, FastifyReply } from 'fastify';
import { verificationService } from './verification.service';

export class VerificationController {
  /**
   * POST /api/v1/verification/start
   */
  async startVerification(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user!.userId;
    try {
      const result = await verificationService.start(userId);
      return reply.status(200).send({
        success: true,
        verificationId: result.verificationId,
        status: result.status,
        redirectUrl: result.redirectUrl,
        providerReference: result.providerReference,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'VERIFICATION_FAILED';
      if (message === 'ALREADY_VERIFIED') {
        return reply.status(409).send({
          success: false,
          error: 'ALREADY_VERIFIED',
          message: 'User is already identity verified',
        });
      }
      if (message === 'PHONE_NOT_VERIFIED') {
        return reply.status(403).send({
          success: false,
          error: 'PHONE_NOT_VERIFIED',
          message: 'Phone number verification required before identity verification',
        });
      }
      if (message === 'USER_NOT_FOUND') {
        return reply.status(404).send({
          success: false,
          error: 'USER_NOT_FOUND',
          message: 'User account not found',
        });
      }
      throw err;
    }
  }

  /**
   * GET /api/v1/verification/status
   */
  async getStatus(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user!.userId;
    const result = await verificationService.getStatus(userId);
    return reply.status(200).send({
      success: true,
      ...result,
    });
  }

  /**
   * POST /api/v1/verification/webhook
   */
  async handleWebhook(request: FastifyRequest, reply: FastifyReply) {
    const signature =
      (request.headers['x-signature'] as string | undefined) ||
      (request.headers['x-fayda-signature'] as string | undefined) ||
      (request.body as { signature?: string })?.signature;

    const result = await verificationService.processWebhook(request.body, signature);
    return reply.status(200).send(result);
  }
}

export const verificationController = new VerificationController();
