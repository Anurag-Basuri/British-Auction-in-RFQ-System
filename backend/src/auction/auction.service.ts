import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TriggerType } from '@prisma/client';

@Injectable()
export class AuctionService {
  constructor(private prisma: PrismaService) {}

  async evaluateExtension(rfqId: number, bidPrice: number, bidTimestamp: Date): Promise<Date | null> {
    const rfq = await this.prisma.rfq.findUnique({ where: { id: rfqId } });
    if (!rfq) return null;

    // Reject bids outside the manual window.
    if (bidTimestamp < rfq.start_time || bidTimestamp > rfq.close_time) {
      throw new BadRequestException('Auction is not currently active');
    }

    // Trigger window check (current_time >= close_time - X).
    const triggerWindowMs = rfq.trigger_window_mins * 60 * 1000;
    const isWithinTriggerWindow = (rfq.close_time.getTime() - bidTimestamp.getTime()) <= triggerWindowMs;

    if (!isWithinTriggerWindow) return null;

    // Check conditions based on configured TriggerType.
    let shouldExtend = false;
    if (rfq.trigger_type === TriggerType.ANY_BID) {
      shouldExtend = true;
    } else {
      // For Rank change or L1 change, we need context.
      const previousL1 = await this.prisma.bid.findFirst({
        where: { rfqId },
        orderBy: [{ price: 'asc' }, { timestamp: 'asc' }],
      });

      if (rfq.trigger_type === TriggerType.L1_CHANGE) {
        shouldExtend = !previousL1 || bidPrice < previousL1.price;
      } else if (rfq.trigger_type === TriggerType.RANK_CHANGE) {
        // Simple heuristic: If it improves price, ranks might shift.
        // More robust: Compare full rank list, but price improvement is the base.
        shouldExtend = true;
      }
    }

    if (shouldExtend) {
      const extMs = rfq.extension_mins * 60 * 1000;
      let newClose = new Date(rfq.close_time.getTime() + extMs);
      
      // Strict cap by forced close time.
      if (newClose > rfq.forced_close_time) {
        newClose = rfq.forced_close_time;
      }

      // If newClose is still greater than existing close, we update.
      if (newClose > rfq.close_time) {
        return newClose;
      }
    }

    return null;
  }
}
