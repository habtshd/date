import { FastifyInstance } from 'fastify';
import fastifyJwt from '@fastify/jwt';
import { env } from '../config/env';

export async function jwtPlugin(fastify: FastifyInstance): Promise<void> {
  await fastify.register(fastifyJwt, {
    secret: env.JWT_ACCESS_SECRET,
  });
}
