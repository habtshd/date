import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { logger } from '../utils/logger';

export function errorHandler(
  error: FastifyError,
  _request: FastifyRequest,
  reply: FastifyReply
): void {
  // Handle Zod validation errors
  if (error instanceof ZodError) {
    const details = error.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));

    reply.status(422).send({
      success: false,
      message: 'Input validation failed',
      details,
    });
    return;
  }

  // Handle Prisma unique constraint violations
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      const target = (error.meta?.target as string[]) || [];
      reply.status(409).send({
        success: false,
        message: `Resource conflict on: ${target.join(', ')}`,
      });
      return;
    }

    if (error.code === 'P2025') {
      reply.status(404).send({
        success: false,
        message: 'The requested database record does not exist',
      });
      return;
    }
  }

  // Fastify status code handling
  const statusCode = error.statusCode || 500;
  if (statusCode >= 500) {
    logger.error('Unhandled Server Error', { error: error.message, stack: error.stack });
  }

  reply.status(statusCode).send({
    success: false,
    message: statusCode >= 500 && process.env.NODE_ENV === 'production'
      ? 'An internal server error occurred'
      : error.message,
  });
}
