import { FastifyRequest, FastifyReply } from 'fastify';
import { authService } from './auth.service';
import { RequestOtpSchema, VerifyOtpSchema, RefreshTokenSchema } from './auth.schema';

export class AuthController {
  async requestOtp(request: FastifyRequest, reply: FastifyReply) {
    const body = RequestOtpSchema.parse(request.body);
    const result = await authService.requestOtp(body.phoneNumber);
    return reply.status(200).send({ success: true, ...result });
  }

  async verifyOtp(request: FastifyRequest, reply: FastifyReply) {
    const body = VerifyOtpSchema.parse(request.body);
    const result = await authService.verifyOtp(body);
    return reply.status(200).send({ success: true, ...result });
  }

  async refreshToken(request: FastifyRequest, reply: FastifyReply) {
    const body = RefreshTokenSchema.parse(request.body);
    const result = await authService.refreshToken(body.refreshToken);
    return reply.status(200).send({ success: true, ...result });
  }

  async logout(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user!.userId;
    const result = await authService.logout(userId);
    return reply.status(200).send({ success: true, ...result });
  }

  async getMe(request: FastifyRequest, reply: FastifyReply) {
    return reply.status(200).send({ success: true, user: request.user });
  }
}

export const authController = new AuthController();
