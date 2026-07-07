import { z } from 'zod';

export const createHospitalSchema = z.object({
  body: z.object({
    name: z.string({ required_error: 'Hospital name is required' }).min(2),
    latitude: z.number({ required_error: 'Latitude is required' }).min(-90).max(90),
    longitude: z.number({ required_error: 'Longitude is required' }).min(-180).max(180),
    address: z.string({ required_error: 'Address is required' }).min(5),
    capacity: z.number({ required_error: 'Capacity is required' }).int().positive(),
    availableBeds: z.number({ required_error: 'Available beds count is required' }).int().nonnegative(),
    contact: z.string({ required_error: 'Contact number is required' }).min(5),
  }),
});

export const updateHospitalSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
    address: z.string().min(5).optional(),
    capacity: z.number().int().positive().optional(),
    availableBeds: z.number().int().nonnegative().optional(),
    contact: z.string().min(5).optional(),
  }),
});
