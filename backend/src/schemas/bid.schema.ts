import { z } from 'zod';

export const createBidSchema = z.object({
  price: z.number().positive(),
});

export type CreateBidDto = z.infer<typeof createBidSchema>;
