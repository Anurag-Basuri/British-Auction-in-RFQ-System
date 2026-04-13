import { prisma } from "../lib/prisma.js";
import { evaluateExtension } from "./auction.service.js";
import { ApiError } from "../utils/ApiError.js";

/**
 * Create a bid within a Prisma transaction to prevent race conditions.
 * Validates RFQ status, evaluates extension triggers, and creates the bid atomically.
 */
export async function createBid(
  rfqId: number,
  supplierId: number,
  dto: {
    freight_charges: number;
    origin_charges: number;
    destination_charges: number;
    transit_time: string;
    quote_validity: Date;
  },
) {
  const timestamp = new Date();

  const price =
    dto.freight_charges + dto.origin_charges + dto.destination_charges;

  return prisma.$transaction(async (tx: any) => {
    // Step 1: Validate RFQ exists and is Active.
    const rfq = await tx.rfq.findUnique({ where: { id: rfqId } });
    if (!rfq) throw new ApiError(404, "RFQ not found");
    if (rfq.status !== "ACTIVE") throw new ApiError(400, "RFQ is not active");

    // Step 1.5: Bid Validation Rule - Ensure new bid is strictly lower than the supplier's previous bid.
    const previousBid = await tx.bid.findFirst({
      where: {
        rfqId: rfqId,
        supplierId: supplierId,
      },
      orderBy: {
        price: "asc", // Get their lowest known bid for this RFQ
      },
    });

    if (previousBid && price >= previousBid.price) {
      throw new ApiError(
        400,
        `Your new total price ($${price}) must be lower than your previous lowest bid ($${previousBid.price}).`,
      );
    }

    // Step 2: Core trigger and extension evaluation.
    // This part ensures no race conditions on close_time due to transactions.
    const previousClose = rfq.close_time;
    const extensionData = await evaluateExtension(
      tx,
      rfqId,
      supplierId,
      price,
      timestamp,
    );

    if (extensionData) {
      await tx.rfq.update({
        where: { id: rfqId },
        data: { close_time: extensionData.newClose },
      });
    }

    // Step 3: Create bid entry.
    const bid = await tx.bid.create({
      data: {
        rfqId,
        supplierId,
        price,
        freight_charges: dto.freight_charges,
        origin_charges: dto.origin_charges,
        destination_charges: dto.destination_charges,
        transit_time: dto.transit_time,
        quote_validity: dto.quote_validity,
        timestamp,
      },
      include: { supplier: { select: { email: true } } },
    });

    // Step 4: Add Activity Log tracking exactly why this close time changed!
    if (extensionData) {
      await tx.extensionLog.create({
        data: {
          rfqId,
          triggerBidId: bid.id,
          reason: extensionData.reason,
          extended_mins: Math.round(
            (extensionData.newClose.getTime() - previousClose.getTime()) /
              60000,
          ),
          previous_close: previousClose,
          new_close: extensionData.newClose,
        },
      });
    }

    return { bid, close_time: extensionData?.newClose || previousClose };
  });
}
