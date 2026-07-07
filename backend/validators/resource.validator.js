import { z } from 'zod';

export const createResourceSchema = z.object({
  body: z.object({
    type: z.enum(['AMBULANCE', 'FIRE_TRUCK', 'BOAT', 'VOLUNTEER'], {
      required_error: 'Resource type must be one of: AMBULANCE, FIRE_TRUCK, BOAT, VOLUNTEER',
    }),
    status: z.enum(['AVAILABLE', 'ASSIGNED', 'MAINTENANCE']).default('AVAILABLE'),
    identifier: z.string({ required_error: 'Identifier (e.g. Plate no/ID) is required' }).min(2),
    latitude: z.number({ required_error: 'Latitude is required' }).min(-90).max(90),
    longitude: z.number({ required_error: 'Longitude is required' }).min(-180).max(180),
    assignedToSosId: z.string().uuid('Invalid SOS UUID').optional().nullable(),
  }),
});

export const updateResourceSchema = z.object({
  body: z.object({
    type: z.enum(['AMBULANCE', 'FIRE_TRUCK', 'BOAT', 'VOLUNTEER']).optional(),
    status: z.enum(['AVAILABLE', 'ASSIGNED', 'MAINTENANCE']).optional(),
    identifier: z.string().min(2).optional(),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
    assignedToSosId: z.string().uuid('Invalid SOS UUID').optional().nullable(),
  }),
});
