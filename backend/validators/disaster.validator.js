import { z } from 'zod';

export const createDisasterSchema = z.object({
  body: z.object({
    name: z.string({ required_error: 'Disaster name is required' }).min(3),
    type: z.enum(['WEATHER', 'FIRE', 'FLOOD', 'EARTHQUAKE', 'OTHER'], {
      required_error: 'Disaster type must be one of: WEATHER, FIRE, FLOOD, EARTHQUAKE, OTHER',
    }),
    severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], {
      required_error: 'Severity level must be one of: LOW, MEDIUM, HIGH, CRITICAL',
    }),
    latitude: z.number({ required_error: 'Latitude is required' }).min(-90).max(90),
    longitude: z.number({ required_error: 'Longitude is required' }).min(-180).max(180),
    radius: z.number({ required_error: 'Impact radius (in kilometers) is required' }).positive(),
    description: z.string({ required_error: 'Description is required' }).min(5),
    active: z.boolean().default(true),
  }),
});

export const updateDisasterSchema = z.object({
  body: z.object({
    name: z.string().min(3).optional(),
    type: z.enum(['WEATHER', 'FIRE', 'FLOOD', 'EARTHQUAKE', 'OTHER']).optional(),
    severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
    radius: z.number().positive().optional(),
    description: z.string().min(5).optional(),
    active: z.boolean().optional(),
  }),
});
