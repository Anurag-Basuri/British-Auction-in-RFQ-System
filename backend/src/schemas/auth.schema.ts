import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  role: z.enum(["BUYER", "SUPPLIER"]),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const googleAuthSchema = z.object({
  token: z.string().min(1),
  role: z.enum(["BUYER", "SUPPLIER"]).optional(),
});

export type RegisterDto = z.infer<typeof registerSchema>;
export type LoginDto = z.infer<typeof loginSchema>;
export type GoogleAuthDto = z.infer<typeof googleAuthSchema>;
