import { Router, Request, Response } from 'express';
import * as bidService from '../services/bid.service.js';
import { scheduleClosure } from '../scheduler/queue.js';
import { broadcastToRfq } from '../lib/socket.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

/**
 * POST /rfq/:rfqId/bid
 * Place a bid on an active auction (Supplier only).
 * Handles extension scheduling and WebSocket broadcasting.
 */
router.post('/:rfqId/bid', authMiddleware, async (req: Request, res: Response) => {
  try {
    const rfqId = +req.params.rfqId;
    const user = (req as any).user;
    const price = req.body.price;

    const result = await bidService.createBid(rfqId, user.sub, price);

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
