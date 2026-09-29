import { z } from 'zod';

export const UpsertProfileSchema = z.object({
  body: z.object({
    displayName: z.string().min(2).max(50),
    birthDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: 'Invalid date format (ISO 8601 required: YYYY-MM-DD)',
    }),
    gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
    city: z.string().min(2).max(100),
    region: z.string().min(2).max(100),
    heightCm: z.number().int().min(100).max(250).optional(),
    bio: z.string().max(500).optional(),
    relationshipIntention: z.enum(['MARRIAGE', 'LONG_TERM', 'SHORT_TERM', 'FRIENDSHIP', 'NOT_SURE']).default('LONG_TERM'),
    religion: z.string().max(50).optional(),
    occupation: z.string().max(100).optional(),
    education: z.string().max(100).optional(),
    languages: z.array(z.string()).default(['Amharic']),
    interestIds: z.array(z.string().uuid()).optional(),
  }),
});

export const AddProfilePhotoSchema = z.object({
  body: z.object({
    originalUrl: z.string().url('Valid URL required for photo'),
    blurredUrl: z.string().url('Valid URL required for blurred teaser photo'),
    isPrimary: z.boolean().default(false),
    displayOrder: z.number().int().min(0).max(9).default(0),
  }),
});

export const UpdatePreferencesSchema = z.object({
  body: z.object({
    minAge: z.number().int().min(18).max(100).default(18),
    maxAge: z.number().int().min(18).max(100).default(55),
    interestedInGenders: z.array(z.enum(['MALE', 'FEMALE', 'OTHER'])).min(1),
    preferredCities: z.array(z.string()).default([]),
    preferredIntentions: z.array(z.enum(['MARRIAGE', 'LONG_TERM', 'SHORT_TERM', 'FRIENDSHIP', 'NOT_SURE'])).default([]),
    onlyVerified: z.boolean().default(true),
  }),
});
