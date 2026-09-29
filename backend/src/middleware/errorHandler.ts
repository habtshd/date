import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

export function errorHandler(
  error: FastifyError | AppError | Error,
  _request: FastifyRequest,
  reply: FastifyReply
): void {
  // 1. AppError (our standard custom application errors)
  if (error instanceof AppError) {
    reply.status(error.statusCode).send({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        ...(error.details ? { details: error.details } : {}),
      },
      message: error.message,
    });
    return;
  }

  // 2. Zod validation errors
  if (error instanceof ZodError) {
    const details = error.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));

    reply.status(422).send({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Input validation failed',
        details,
      },
      message: 'Input validation failed',
      details,
    });
    return;
  }

  // 3. Prisma database errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      const target = (error.meta?.target as string[]) || [];
      reply.status(409).send({
        success: false,
        error: {
          code: 'RESOURCE_CONFLICT',
          message: `Resource conflict on: ${target.join(', ')}`,
        },
        message: `Resource conflict on: ${target.join(', ')}`,
      });
      return;
    }

    if (error.code === 'P2025') {
      reply.status(404).send({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'The requested database record does not exist',
        },
        message: 'The requested database record does not exist',
      });
      return;
    }
  }

  // 4. General Fastify / Unhandled errors
  const statusCode = (error as any).statusCode || 500;
  if (statusCode >= 500) {
    logger.error('Unhandled Server Error', { error: error.message, stack: error.stack });
  }

  const message =
    statusCode >= 500 && process.env.NODE_ENV === 'production'
      ? 'An internal server error occurred'
      : error.message;

  reply.status(statusCode).send({
    success: false,
    error: {
      code: statusCode >= 500 ? 'INTERNAL_SERVER_ERROR' : 'ERROR',
      message,
    },
    message,
  });
}
