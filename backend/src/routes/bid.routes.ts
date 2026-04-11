import { Router, Request, Response } from 'express';
import * as bidService from '../services/bid.service.js';
import { scheduleClosure } from '../scheduler/queue.js';
import { broadcastToRfq } from '../lib/socket.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { createBidSchema } from '../schemas/bid.schema.js';

const router = Router();

/**
 * POST /rfq/:rfqId/bid
 * Place a bid on an active auction (Supplier only).
 * Handles extension scheduling and WebSocket broadcasting.
 */
router.post('/:rfqId/bid', authMiddleware, requireRole(['SUPPLIER']), validate(createBidSchema), async (req: Request, res: Response) => {
  try {
    const rfqId = +req.params.rfqId;
    const user = (req as any).user;
    
    // Destructure properties from Zod payload
    const { freight_charges, origin_charges, destination_charges, transit_time, quote_validity } = req.body;

    const result = await bidService.createBid(rfqId, user.sub, {
      freight_charges,
      origin_charges,
      destination_charges,
      transit_time,
      quote_validity: new Date(quote_validity)
    });

    // If extension occurred, reschedule the BullMQ closure job.
    if (result.close_time) {
      await scheduleClosure(rfqId, result.close_time);
      broadcastToRfq(rfqId, 'AUCTION_EXTENDED', {
        new_close: result.close_time,
      });
    }

    // Always broadcast new bids.
    broadcastToRfq(rfqId, 'BID_PLACED', result.bid);

    res.status(201).json(result);
  } catch (err: any) {
    const status = err.status || 500;
    res.status(status).json({ message: err.message || 'Internal server error' });
  }
});

export default router;
