import { Request, Response, NextFunction } from 'express';

/**
 * Middleware factory to enforce role-based access control.
 * Must be used after authMiddleware so `req.user` is available.
 * 
 * @param allowedRoles Array of roles that are permitted to access the route
 */
export function requireRole(allowedRoles: ('BUYER' | 'SUPPLIER')[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const userRole = (req as any).user?.role;
    
    if (!userRole || !allowedRoles.includes(userRole)) {
      res.status(403).json({ message: 'Forbidden: Insufficient role permissions' });
      return;
    }
    
    next();
  };
}
