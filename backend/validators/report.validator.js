import { z } from 'zod';

export const createReportSchema = z.object({
  body: z.object({
    latitude: z.number({ required_error: 'Latitude is required' }).min(-90).max(90),
    longitude: z.number({ required_error: 'Longitude is required' }).min(-180).max(180),
    title: z.string({ required_error: 'Title is required' }).min(3),
    description: z.string({ required_error: 'Description is required' }).min(5),
    type: z.enum(['WEATHER', 'FIRE', 'FLOOD', 'EARTHQUAKE', 'OTHER'], {
      required_error: 'Report type must be one of: WEATHER, FIRE, FLOOD, EARTHQUAKE, OTHER',
    }),
    mediaUrls: z.array(z.string().url('Invalid media URL')).default([]),
  }),
});
