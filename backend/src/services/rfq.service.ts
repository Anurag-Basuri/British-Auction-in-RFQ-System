import { prisma } from '../lib/prisma.js';
import { scheduleClosure } from '../scheduler/queue.js';
import type { CreateRfqDto } from '../schemas/rfq.schema.js';

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
      buyerId,
    },
  });

  // Schedule the initial close job
  await scheduleClosure(rfq.id, rfq.close_time);

  return rfq;
}

/**
 * List all RFQs with buyer info and bid counts.
 */
export async function findAll() {
  return prisma.rfq.findMany({
    include: {
      buyer: { select: { email: true } },
      _count: { select: { bids: true } },
    },
  });
}

/**
 * Get full RFQ details with ordered bids.
 */
export async function findOne(id: number) {
  const rfq = await prisma.rfq.findUnique({
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

  if (!rfq) {
    throw { status: 404, message: 'RFQ not found' };
  }

  return rfq;
}
