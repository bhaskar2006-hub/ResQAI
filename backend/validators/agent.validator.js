import { z } from 'zod';

export const registerAgentSchema = z.object({
  body: z.object({
    name: z.string({ required_error: 'Agent name is required' }).min(2),
    type: z.enum(['ALLOCATOR', 'TRANSLATOR', 'FORECASTER', 'SEARCH_AND_RESCUE'], {
      required_error: 'Agent type must be one of: ALLOCATOR, TRANSLATOR, FORECASTER, SEARCH_AND_RESCUE',
    }),
    endpointUrl: z.string().url('Invalid webhook endpoint URL').optional().nullable(),
    capabilities: z.array(z.string()).default([]),
  }),
});

export const proposeActionSchema = z.object({
  body: z.object({
    actionType: z.string({ required_error: 'Action type is required' }).min(3),
    targetId: z.string().uuid('Invalid target UUID').optional().nullable(),
    details: z.record(z.any(), { required_error: 'Action details are required' }),
  }),
});
