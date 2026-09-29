import { FastifyInstance } from 'fastify';
import { authenticate } from '../../middleware/auth';
import { photoController } from './photo.controller';

export async function photoRoutes(app: FastifyInstance): Promise<void> {
  app.get('/', { preHandler: [authenticate] }, photoController.getMyPhotos);
  app.post('/upload-url', { preHandler: [authenticate] }, photoController.getPhotoUploadUrl);
  app.post('/complete', { preHandler: [authenticate] }, photoController.completePhotoUpload);
  app.delete('/:photoId', { preHandler: [authenticate] }, photoController.deletePhoto);
  app.patch('/:photoId/primary', { preHandler: [authenticate] }, photoController.setPrimaryPhoto);
}
