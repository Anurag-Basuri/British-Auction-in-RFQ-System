import { Request, Response, NextFunction } from "express";
import { logger } from "../lib/logger.js";
import { ZodError } from "zod";
import { ApiError } from "../utils/ApiError.js";
import { env } from "../config/env.js";

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  let error = err;

  // Transform generic errors into ApiError standard format if they aren't already
  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode
      ? error.statusCode
      : error instanceof ZodError
        ? 400
        : 500;
    const message = error.message || "Something went wrong";
    error = new ApiError(
      statusCode,
      message,
      error instanceof ZodError ? error.errors : [],
      error.stack,
    );
  }

  const isProduction = env.NODE_ENV === "production";
  const responseData = {
    success: error.success,
    message: error.message,
    errors: error.errors,
    ...(isProduction ? {} : { stack: error.stack }),
  };

  // Log error accurately
  if (error.statusCode >= 500) {
    logger.error(
      { err: error, path: req.path },
      "Unhandled Critical Server Error",
    );
  } else {
    logger.warn(
      { path: req.path, status: error.statusCode, message: error.message },
      "Client Request Error",
    );
  }

  res.status(error.statusCode).json(responseData);
}
