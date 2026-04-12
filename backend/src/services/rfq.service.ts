import { prisma } from '../lib/prisma.js';
import { scheduleClosure } from '../scheduler/queue.js';
import type { CreateRfqDto } from '../schemas/rfq.schema.js';
import { ApiError } from '../utils/ApiError.js';

/**
 * Create a new RFQ auction and schedule its initial close job.
 */
export async function create(buyerId: number, dto: CreateRfqDto) {
  const rfq = await prisma.rfq.create({
    data: {
      ...dto,
      status: 'ACTIVE', // Automatically activate for current system
      start_time: new Date(dto.start_time),
      close_time: new Date(dto.close_time),
      forced_close_time: new Date(dto.forced_close_time),
      pickup_date: dto.pickup_date ? new Date(dto.pickup_date) : null,
      buyerId,
    },
  });

  // Schedule the initial close job
  await scheduleClosure(rfq.id, rfq.close_time);

  return rfq;
}

/**
 * List all RFQs with buyer info, bid counts, and current lowest bid.
 */
export async function findAll() {
  const rfqs = await prisma.rfq.findMany({
    include: {
      buyer: { select: { email: true } },
      _count: { select: { bids: true } },
      bids: {
        orderBy: { price: 'asc' },
        take: 1,
        select: { price: true }
      }
    },
  });

  return rfqs.map((rfq: any) => {
    const { bids, ...rest } = rfq;
    return {
      ...rest,
      currentLowestBid: bids.length > 0 ? bids[0].price : null
    };
  });
}

/**
 * Get full RFQ details with ordered bids and activity log.
 */
export async function findOne(id: number) {
  const rfq = await prisma.rfq.findUnique({
    where: { id },
    include: {
      buyer: { select: { email: true } },
      extensionLogs: {
        orderBy: { createdAt: 'desc' }
      },
      bids: {
        orderBy: [
          { price: 'asc' },
          { timestamp: 'asc' },
        ],
        include: { supplier: { select: { email: true } } },
      },
    },
  });

  if (!rfq) {
    throw new ApiError(404, 'RFQ not found');
  }

  return rfq;
}
