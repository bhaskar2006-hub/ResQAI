import { z } from 'zod';

export const createSosSchema = z.object({
  body: z.object({
    latitude: z.number({ required_error: 'Latitude is required' }).min(-90).max(90),
    longitude: z.number({ required_error: 'Longitude is required' }).min(-180).max(180),
    description: z.string({ required_error: 'Description is required' }).min(5),
    audioUrl: z.string().url('Invalid audio URL').optional().nullable(),
    videoUrl: z.string().url('Invalid video URL').optional().nullable(),
    imageUrl: z.string().url('Invalid image URL').optional().nullable(),
  }),
});

export const updateSosSchema = z.object({
  body: z.object({
    status: z.enum(['PENDING', 'ASSIGNED', 'RESOLVED']).optional(),
    description: z.string().min(5).optional(),
    audioUrl: z.string().url('Invalid audio URL').optional().nullable(),
    videoUrl: z.string().url('Invalid video URL').optional().nullable(),
    imageUrl: z.string().url('Invalid image URL').optional().nullable(),
  }),
});
