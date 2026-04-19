import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";

/**
 * Express middleware that verifies JWT tokens from the Authorization header.
 * Attaches the decoded payload to `req.user` on success.
 * Replaces the NestJS JwtAuthGuard.
 */
export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return next(new ApiError(401, "Authentication token not found in request headers"));
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!);
    (req as any).user = payload;
    next();
  } catch (error) {
    next(error); // Passes the raw JsonWebTokenError/TokenExpiredError natively to global boundary
  }
}
