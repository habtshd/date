import { z } from 'zod';

export const UpsertProfileSchema = z.object({
  body: z.object({
    firstName: z.string().min(2).max(50),
    dateOfBirth: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: 'Invalid date format (ISO 8601 required: YYYY-MM-DD)',
    }),
    gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
    city: z.string().min(2).max(100),
    bio: z.string().max(1000).optional(),
    relationshipGoal: z.enum([
      'MARRIAGE',
      'SERIOUS_RELATIONSHIP',
      'DATING',
      'GETTING_TO_KNOW',
      'FRIENDSHIP',
    ]).default('SERIOUS_RELATIONSHIP'),
    interestIds: z.array(z.string().uuid()).optional(),
  }),
});

export const AddProfilePhotoSchema = z.object({
  body: z.object({
    storageKey: z.string().min(1, 'Storage key is required'),
    blurredStorageKey: z.string().optional(),
    isPrimary: z.boolean().default(false),
  }),
});

export const UpdatePreferencesSchema = z.object({
  body: z.object({
    minAge: z.number().int().min(18).max(100).default(18),
    maxAge: z.number().int().min(18).max(100).default(55),
    preferredGender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
    preferredCity: z.string().optional(),
    relationshipGoal: z.enum([
      'MARRIAGE',
      'SERIOUS_RELATIONSHIP',
      'DATING',
      'GETTING_TO_KNOW',
      'FRIENDSHIP',
    ]).optional(),
    maxDistanceKm: z.number().int().positive().default(50),
  }),
});
