import { prisma } from '../lib/prisma.js';
import { evaluateExtension } from './auction.service.js';

/**
 * Create a bid within a Prisma transaction to prevent race conditions.
 * Validates RFQ status, evaluates extension triggers, and creates the bid atomically.
 */
export async function createBid(rfqId: number, supplierId: number, price: number) {
  const timestamp = new Date();

  return prisma.$transaction(async (tx: any) => {
    // Step 1: Validate RFQ exists and is Active.
    const rfq = await tx.rfq.findUnique({ where: { id: rfqId } });
    if (!rfq) throw { status: 400, message: 'RFQ not found' };
    if (rfq.status !== 'ACTIVE') throw { status: 400, message: 'RFQ is not active' };

    // Step 2: Core trigger and extension evaluation.
    // This part ensures no race conditions on close_time due to transactions.
    const newCloseTime = await evaluateExtension(rfqId, price, timestamp);

    if (newCloseTime) {
      await tx.rfq.update({
        where: { id: rfqId },
        data: { close_time: newCloseTime },
      });
    }

    // Step 3: Create bid entry.
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
