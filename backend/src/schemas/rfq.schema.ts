import { z } from 'zod';

export const createRfqSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  start_time: z.string().datetime(),
  close_time: z.string().datetime(),
  forced_close_time: z.string().datetime(),
  pickup_date: z.string().datetime().optional(),
  trigger_window_mins: z.number().int().positive(),
  extension_mins: z.number().int().positive(),
  trigger_type: z.enum(['ANY_BID', 'RANK_CHANGE', 'L1_CHANGE']),
}).superRefine((data, ctx) => {
  const start = new Date(data.start_time);
  const close = new Date(data.close_time);
  const forced = new Date(data.forced_close_time);

  if (start >= close) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Bid Close Time must be after Bid Start Time",
      path: ["close_time"]
    });
  }

  if (close >= forced) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Forced Bid Close Time must be after Bid Close Time",
      path: ["forced_close_time"]
    });
  }
});

export type CreateRfqDto = z.infer<typeof createRfqSchema>;
