import { z } from 'zod';

export const updateUserSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address').optional(),
    name: z.string().min(2, 'Name must be at least 2 characters long').optional(),
    role: z.enum(['CITIZEN', 'GOVERNMENT', 'NGO', 'ADMIN']).optional(),
  }),
});
