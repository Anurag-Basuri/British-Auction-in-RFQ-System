import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuctionService } from '../auction/auction.service';

@Injectable()
export class BidService {
  constructor(
    private prisma: PrismaService,
    private auctionService: AuctionService
  ) {}

  async createBid(rfqId: number, supplierId: number, price: number) {
    const timestamp = new Date();

    return this.prisma.$transaction(async (tx) => {
      // Step 1: Validate RFQ exists and is Active.
      const rfq = await tx.rfq.findUnique({ where: { id: rfqId } });
      if (!rfq) throw new BadRequestException('RFQ not found');
      if (rfq.status !== 'ACTIVE') throw new BadRequestException('RFQ is not active');

      // Step 2: Core trigger and extension evaluation. 
      // This part ensures No race conditions on close_time due to transactions.
      const newCloseTime = await this.auctionService.evaluateExtension(rfqId, price, timestamp);

      if (newCloseTime) {
        await tx.rfq.update({
          where: { id: rfqId },
          data: { close_time: newCloseTime },
        });
      }

      // Step 3: Create bid entries.
      const bid = await tx.bid.create({
        data: {
          rfqId,
          supplierId,
          price,
          timestamp,
        },
        include: { supplier: { select: { email: true } } },
      });

      return { bid, close_time: newCloseTime || rfq.close_time };
    });
  }
}
