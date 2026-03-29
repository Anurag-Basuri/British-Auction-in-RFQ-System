import { Controller, Post, Body, UseGuards, Request, Param } from '@nestjs/common';
import { BidService } from './bid.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuctionQueueService } from '../scheduler/auction-queue.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';

@Controller('rfq/:rfqId/bid')
@UseGuards(JwtAuthGuard)
export class BidController {
  constructor(
    private readonly bidService: BidService,
    private readonly auctionQueue: AuctionQueueService,
    private readonly notifications: NotificationsGateway
  ) {}

  @Post()
  async placeBid(
    @Param('rfqId') rfqId: string,
    @Request() req: any,
    @Body('price') price: number
  ) {
    const result = await this.bidService.createBid(+rfqId, +req.user.sub, price);

    // If extension occurred, update the logic in BullMQ.
    if (result.close_time) {
      await this.auctionQueue.scheduleClosure(+rfqId, result.close_time);
      this.notifications.broadcastToRfq(+rfqId, 'AUCTION_EXTENDED', {
        new_close: result.close_time,
      });
    }

    // Always broadcast new bids.
    this.notifications.broadcastToRfq(+rfqId, 'BID_PLACED', result.bid);

    return result;
  }
}
