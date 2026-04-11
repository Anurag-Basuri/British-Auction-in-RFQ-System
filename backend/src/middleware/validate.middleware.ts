import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

/**
 * Factory function that returns an Express middleware for validating
 * request bodies against a Zod schema.
 * Replaces NestJS ValidationPipe + class-validator DTOs.
 */
export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        message: 'Validation failed',
        errors: result.error.flatten().fieldErrors,
      });
      return;
    }
    req.body = result.data;
    next();
  };
}
