import { FastifyInstance } from 'fastify';
import { authenticate } from '../../middleware/auth';
import {
  getMyProfile,
  createMyProfile,
  updateMyProfile,
  getPreferences,
  updatePreferences,
  getInterests,
  setUserInterests,
  getPhotoUploadUrl,
  completePhotoUpload,
  deletePhoto,
  setPrimaryPhoto,
} from './profile.controller';

export async function profileRoutes(app: FastifyInstance): Promise<void> {
  // Core Profile
  app.get('/', { preHandler: [authenticate] }, getMyProfile);
  app.get('/me', { preHandler: [authenticate] }, getMyProfile);
  app.post('/', { preHandler: [authenticate] }, createMyProfile);
  app.patch('/', { preHandler: [authenticate] }, updateMyProfile);
  app.patch('/me', { preHandler: [authenticate] }, updateMyProfile);
  app.put('/me', { preHandler: [authenticate] }, updateMyProfile);

  // Preferences
  app.get('/preferences', { preHandler: [authenticate] }, getPreferences);
  app.put('/preferences', { preHandler: [authenticate] }, updatePreferences);
  app.patch('/preferences', { preHandler: [authenticate] }, updatePreferences);

  // Interests
  app.get('/interests', getInterests);
  app.put('/interests', { preHandler: [authenticate] }, setUserInterests);
  app.post('/interests', { preHandler: [authenticate] }, setUserInterests);

  // Photos
  app.post('/photos/upload-url', { preHandler: [authenticate] }, getPhotoUploadUrl);
  app.post('/photos/complete', { preHandler: [authenticate] }, completePhotoUpload);
  app.delete('/photos/:photoId', { preHandler: [authenticate] }, deletePhoto);
  app.patch('/photos/:photoId/primary', { preHandler: [authenticate] }, setPrimaryPhoto);
}
