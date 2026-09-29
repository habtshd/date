import { FastifyInstance } from 'fastify';
import { profilesController } from './profiles.controller';
import { authenticate } from '../../middleware/auth';

export async function profilesRoutes(fastify: FastifyInstance): Promise<void> {
  // Authenticated profile operations
  fastify.get('/me', { preHandler: [authenticate] }, profilesController.getMyProfile);
  fastify.get('/', { preHandler: [authenticate] }, profilesController.getMyProfile);
  fastify.put('/me', { preHandler: [authenticate] }, profilesController.upsertProfile);
  fastify.patch('/me', { preHandler: [authenticate] }, profilesController.upsertProfile);
  fastify.patch('/', { preHandler: [authenticate] }, profilesController.upsertProfile);

  // Photos
  fastify.post('/photos/presign', { preHandler: [authenticate] }, profilesController.presignPhoto);
  fastify.post('/photos', { preHandler: [authenticate] }, profilesController.addPhoto);
  fastify.delete('/photos/:photoId', { preHandler: [authenticate] }, profilesController.deletePhoto);

  // Preferences
  fastify.put('/preferences', { preHandler: [authenticate] }, profilesController.updatePreferences);
  fastify.patch('/preferences', { preHandler: [authenticate] }, profilesController.updatePreferences);

  // Interests (public reference)
  fastify.get('/interests', profilesController.getInterests);
}
