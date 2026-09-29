import { FastifyRequest, FastifyReply } from 'fastify';
import { verificationService } from './verification.service';
import { StartVerificationSchema, VerificationWebhookSchema } from './verification.schema';

export class VerificationController {
  async startVerification(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user!.userId;
    const body = StartVerificationSchema.parse(request.body || {});
    const result = await verificationService.startVerification(userId, body.provider);
    return reply.status(200).send({ success: true, ...result });
  }

  async getStatus(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user!.userId;
    const result = await verificationService.getStatus(userId);
    return reply.status(200).send({ success: true, ...result });
  }

  async handleWebhook(request: FastifyRequest, reply: FastifyReply) {
    const body = VerificationWebhookSchema.parse(request.body);
    const result = await verificationService.handleWebhook(body);
    return reply.status(200).send(result);
  }
}

export const verificationController = new VerificationController();
