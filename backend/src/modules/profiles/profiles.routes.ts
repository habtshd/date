import { Router } from 'express';
import { profilesController } from './profiles.controller';
import { requireAuth } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate';
import { UpsertProfileSchema, AddProfilePhotoSchema, UpdatePreferencesSchema } from './profiles.schemas';

const router = Router();

router.get(
  '/me',
  requireAuth,
  profilesController.getMyProfile
);

router.put(
  '/me',
  requireAuth,
  validate(UpsertProfileSchema),
  profilesController.upsertProfile
);

router.post(
  '/photos',
  requireAuth,
  validate(AddProfilePhotoSchema),
  profilesController.addPhoto
);

router.delete(
  '/photos/:photoId',
  requireAuth,
  profilesController.deletePhoto
);

router.put(
  '/preferences',
  requireAuth,
  validate(UpdatePreferencesSchema),
  profilesController.updatePreferences
);

router.get(
  '/interests',
  profilesController.getInterests
);

export const profilesRouter = router;
