import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';

@Processor('auction')
export class AuctionProcessor extends WorkerHost {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsGateway
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { rfqId } = job.data;

    // Step 1: Ensure RFQ still exists and is ACTIVE.
    const rfq = await this.prisma.rfq.findUnique({ where: { id: rfqId } });
    if (!rfq || rfq.status === 'CLOSED') return;

    // Step 2: Check current time vs close_time (for accuracy).
    const now = new Date();
    if (now >= rfq.close_time || now >= rfq.forced_close_time) {
      await this.prisma.rfq.update({
        where: { id: rfqId },
        data: { status: 'CLOSED' },
      });

      // Notify all clients of auction closure.
      this.notifications.broadcastToRfq(rfqId, 'AUCTION_CLOSED', { rfqId, status: 'CLOSED' });
    }
  }
}
