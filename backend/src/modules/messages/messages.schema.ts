import { z } from 'zod';

export const ConversationMessageParamsSchema = z.object({
  id: z.string().uuid('Invalid conversation UUID format'),
});

export const SendMessageBodySchema = z.object({
  content: z.string().min(1, 'Message content cannot be empty').max(2000, 'Message exceeds 2000 characters limit'),
  messageType: z.enum(['TEXT', 'IMAGE', 'VOICE']).default('TEXT'),
});

export const GetMessagesQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
});
