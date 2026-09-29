import { z } from 'zod';

export const createProfileSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name cannot exceed 50 characters'),

  dateOfBirth: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), {
      message: 'Invalid date format (ISO 8601 required: YYYY-MM-DD or datetime)',
    }),

  gender: z.enum(['MALE', 'FEMALE', 'OTHER'], {
    errorMap: () => ({ message: 'Gender must be MALE, FEMALE, or OTHER' }),
  }),

  city: z
    .string()
    .trim()
    .min(2, 'City must be at least 2 characters')
    .max(100, 'City cannot exceed 100 characters'),

  bio: z
    .string()
    .trim()
    .max(1000, 'Bio cannot exceed 1000 characters')
    .optional(),

  relationshipGoal: z
    .enum([
      'MARRIAGE',
      'SERIOUS_RELATIONSHIP',
      'DATING',
      'GETTING_TO_KNOW',
      'FRIENDSHIP',
    ])
    .optional(),
});

export const updateProfileSchema = createProfileSchema.partial();

export const updatePreferencesSchema = z
  .object({
    minAge: z.number().int().min(18).max(100).default(18),
    maxAge: z.number().int().min(18).max(100).default(100),
    preferredGender: z.enum(['MALE', 'FEMALE', 'OTHER']).nullable().optional(),
    preferredCity: z.string().trim().nullable().optional(),
    relationshipGoal: z
      .enum([
        'MARRIAGE',
        'SERIOUS_RELATIONSHIP',
        'DATING',
        'GETTING_TO_KNOW',
        'FRIENDSHIP',
      ])
      .nullable()
      .optional(),
    maxDistanceKm: z.number().int().positive().nullable().optional(),
  })
  .refine((data) => data.minAge <= data.maxAge, {
    message: 'Minimum age cannot be greater than maximum age',
    path: ['minAge'],
  });

export const updateInterestsSchema = z.object({
  interestIds: z.array(z.string().uuid('Invalid interest UUID format')),
});

export const uploadPhotoUrlSchema = z.object({
  mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp'], {
    errorMap: () => ({ message: 'Only JPEG, PNG, and WebP images are allowed' }),
  }),
});

export const completePhotoUploadSchema = z.object({
  storageKey: z.string().min(1, 'storageKey is required'),
  isPrimary: z.boolean().default(false),
});

export const photoIdParamSchema = z.object({
  photoId: z.string().uuid('Invalid photo UUID format'),
});

export type CreateProfileInput = z.infer<typeof createProfileSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UpdatePreferencesInput = z.infer<typeof updatePreferencesSchema>;
export type UpdateInterestsInput = z.infer<typeof updateInterestsSchema>;
export type UploadPhotoUrlInput = z.infer<typeof uploadPhotoUrlSchema>;
export type CompletePhotoUploadInput = z.infer<typeof completePhotoUploadSchema>;
