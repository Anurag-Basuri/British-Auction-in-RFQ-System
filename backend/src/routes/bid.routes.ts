import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { createBidSchema } from '../schemas/bid.schema.js';
import { createBidController } from '../controllers/bid.controller.js';

const router = Router();

router.post('/:rfqId/bid', authMiddleware, requireRole(['SUPPLIER']), validate(createBidSchema), createBidController);

export default router;
