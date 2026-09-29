import { FastifyRequest, FastifyReply } from 'fastify';
import { paymentsService } from './payments.service';
import { CreatePaymentSchema, PaymentIdParamSchema, PaymentWebhookSchema } from './payments.schema';

export class PaymentsController {
  async createPayment(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user!.userId;
    const body = CreatePaymentSchema.parse(request.body);
    const result = await paymentsService.initiateConversationPayment(
      userId,
      body.conversationId,
      body.provider
    );
    return reply.status(201).send({ success: true, ...result });
  }

  async getPayment(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user!.userId;
    const params = PaymentIdParamSchema.parse(request.params);
    const payment = await paymentsService.getPaymentById(userId, params.id);
    return reply.status(200).send({ success: true, payment });
  }

  async handleWebhook(request: FastifyRequest, reply: FastifyReply) {
    const body = PaymentWebhookSchema.parse(request.body);
    const signature = request.headers['x-chapa-signature'] as string | undefined;
    const provider = (body.provider as string) || 'CHAPA';
    const result = await paymentsService.processProviderWebhook(body, signature, provider);
    return reply.status(200).send(result);
  }
}

export const paymentsController = new PaymentsController();
