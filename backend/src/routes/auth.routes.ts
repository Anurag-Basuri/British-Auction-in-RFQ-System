import { Router, Request, Response } from 'express';
import * as authService from '../services/auth.service.js';
import { validate } from '../middleware/validate.middleware.js';
import { registerSchema, loginSchema } from '../schemas/auth.schema.js';

const router = Router();

/**
 * POST /auth/register
 * Register a new user (Buyer or Supplier).
 */
router.post('/register', validate(registerSchema), async (req: Request, res: Response) => {
  try {
    const result = await authService.register(req.body);
    res.status(201).json(result);
  } catch (err: any) {
    const status = err.status || 500;
    res.status(status).json({ message: err.message || 'Internal server error' });
  }
});

/**
 * POST /auth/login
 * Login with email and password, returns JWT.
 */
router.post('/login', validate(loginSchema), async (req: Request, res: Response) => {
  try {
    const result = await authService.login(req.body);
    res.json(result);
  } catch (err: any) {
    const status = err.status || 500;
    res.status(status).json({ message: err.message || 'Internal server error' });
  }
});

export default router;
