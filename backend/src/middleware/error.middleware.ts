import { Request, Response, NextFunction } from 'express';
import { logger } from '../lib/logger.js';
import { ZodError } from 'zod';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  // Capture the status code from custom thrown objects, or default to 500
  const status = err.status || 500;
  
  // Strip stack traces in production unless it's a critical unhandled server error
  const isProduction = process.env.NODE_ENV === 'production';
  const responseData = {
    message: err.message || 'Internal Server Error',
    ...(isProduction ? {} : { stack: err.stack }),
  };

  // Log error accurately
  if (status >= 500) {
    logger.error({ err, path: req.path }, 'Unhandled Critical Server Error');
  } else {
    logger.warn({ path: req.path, status, message: err.message }, 'Client Request Error');
  }

  res.status(status).json(responseData);
}
