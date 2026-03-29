import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRfqDto } from './dto/rfq.dto';
import { AuctionQueueService } from '../scheduler/auction-queue.service';

@Injectable()
export class RfqService {
  constructor(
    private prisma: PrismaService,
    private auctionQueue: AuctionQueueService
  ) {}

  async create(buyerId: number, dto: CreateRfqDto) {
    const rfq = await this.prisma.rfq.create({
      data: {
        ...dto,
        status: 'ACTIVE', // Automatically activate for current system
        start_time: new Date(dto.start_time),
        close_time: new Date(dto.close_time),
        forced_close_time: new Date(dto.forced_close_time),
        buyerId,
      },
    });

    // Schedule the initial close job
    await this.auctionQueue.scheduleClosure(rfq.id, rfq.close_time);
    
    return rfq;
  }

  async findAll() {
    return this.prisma.rfq.findMany({
      include: {
        buyer: { select: { email: true } },
        _count: { select: { bids: true } },
      },
    });
  }

  async findOne(id: number) {
    const rfq = await this.prisma.rfq.findUnique({
      where: { id },
      include: {
        buyer: { select: { email: true } },
        bids: {
          orderBy: [
            { price: 'asc' },
            { timestamp: 'asc' },
          ],
          include: { supplier: { select: { email: true } } },
        },
      },
    });
    if (!rfq) throw new NotFoundException('RFQ not found');
    return rfq;
  }
}
