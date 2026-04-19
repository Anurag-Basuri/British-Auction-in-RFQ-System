import { Request, Response, NextFunction } from "express";
import { logger } from "../lib/logger.js";
import { ZodError } from "zod";
import { ApiError } from "../utils/ApiError.js";
import { env } from "../config/env.js";
import { Prisma } from "@prisma/client";

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  let error = err;

  // Transform known errors into ApiError standard format
  if (!(error instanceof ApiError)) {
    let statusCode = error.statusCode || 500;
    let message = error.message || "Something went wrong";
    let formattedErrors: any = [];

    // 1. Zod Validation Errors
    if (error instanceof ZodError) {
      statusCode = 400;
      message = "Data validation failed";
      
      // Convert Zod's deep array into a readable object map string array
      const fieldErrors = error.flatten().fieldErrors;
      formattedErrors = Object.entries(fieldErrors).map(
        ([field, msgs]) => `${field}: ${msgs?.join(", ")}`
      );
    } 
    // 2. Prisma Database Errors
    else if (error instanceof Prisma.PrismaClientKnownRequestError) {
      statusCode = 400;
      if (error.code === 'P2002') {
        message = "A conflicting record already exists (Unique constraint failed)";
      } else if (error.code === 'P2025') {
        message = "Requested record was not found in the database";
        statusCode = 404;
      } else {
        message = "Database request violated logical constraints";
      }
    } 
    else if (error instanceof Prisma.PrismaClientValidationError) {
      statusCode = 400;
      message = "Invalid data provided to database";
    }
    // 3. JWT Authentication Errors
    else if (error.name === "TokenExpiredError") {
      statusCode = 401;
      message = "Your session has expired. Please login again.";
    } 
    else if (error.name === "JsonWebTokenError") {
      statusCode = 401;
      message = "Invalid authentication token provided.";
    }

    error = new ApiError(statusCode, message, formattedErrors, error.stack);
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
