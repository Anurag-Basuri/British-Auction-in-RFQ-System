import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

/**
 * Express middleware that verifies JWT tokens from the Authorization header.
 * Attaches the decoded payload to `req.user` on success.
 * Replaces the NestJS JwtAuthGuard.
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    res.status(401).json({ message: 'Token not found' });
    return;
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!);
    (req as any).user = payload;
    next();
  } catch {
    res.status(401).json({ message: 'Token verification failed' });
  }
}
