import { z } from "zod";

export const createBidSchema = z.object({
  freight_charges: z.number().nonnegative(),
  origin_charges: z.number().nonnegative(),
  destination_charges: z.number().nonnegative(),
  transit_time: z.string().min(1),
  quote_validity: z.string().datetime(),
});

export type CreateBidDto = z.infer<typeof createBidSchema>;
