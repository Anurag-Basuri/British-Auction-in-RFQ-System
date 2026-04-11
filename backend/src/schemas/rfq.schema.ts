import { z } from 'zod';

export const createRfqSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  start_time: z.string(),
  close_time: z.string(),
  forced_close_time: z.string(),
  trigger_window_mins: z.number().int().positive(),
  extension_mins: z.number().int().positive(),
  trigger_type: z.enum(['ANY_BID', 'RANK_CHANGE', 'L1_CHANGE']),
});

export type CreateRfqDto = z.infer<typeof createRfqSchema>;
