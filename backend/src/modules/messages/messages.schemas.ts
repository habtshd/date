import { z } from 'zod';

export const SendMessageSchema = z.object({
  body: z.object({
    messageType: z.enum(['TEXT', 'IMAGE', 'VOICE']).default('TEXT'),
    content: z.string().min(1, 'Message content cannot be empty').max(2000).optional(),
    mediaUrl: z.string().url().optional(),
    mediaMetadata: z.record(z.unknown()).optional(),
  }).refine((data) => data.content || data.mediaUrl, {
    message: 'Either text content or media URL must be provided',
  }),
});
