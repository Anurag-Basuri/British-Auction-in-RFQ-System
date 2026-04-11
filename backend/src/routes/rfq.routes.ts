import { Router, Request, Response } from 'express';
import * as rfqService from '../services/rfq.service.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { createRfqSchema } from '../schemas/rfq.schema.js';

const router = Router();

// All RFQ routes require authentication
router.use(authMiddleware);

/**
 * POST /rfq
 * Create a new RFQ auction (Buyer only).
 */
router.post('/', validate(createRfqSchema), async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const result = await rfqService.create(user.sub, req.body);
    res.status(201).json(result);
  } catch (err: any) {
    const status = err.status || 500;
    res.status(status).json({ message: err.message || 'Internal server error' });
  }
});

/**
 * GET /rfq
 * List all RFQs with buyer info and bid counts.
 */
router.get('/', async (_req: Request, res: Response) => {
  try {
    const result = await rfqService.findAll();
    res.json(result);
  } catch (err: any) {
    const status = err.status || 500;
    res.status(status).json({ message: err.message || 'Internal server error' });
  }
});

/**
 * GET /rfq/:id
 * Get full RFQ details with ordered bids.
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const result = await rfqService.findOne(+req.params.id);
    res.json(result);
  } catch (err: any) {
    const status = err.status || 500;
    res.status(status).json({ message: err.message || 'Internal server error' });
  }
});

export default router;
