import { prisma } from '../lib/prisma.js';

/**
 * Evaluate whether a bid should trigger an auction time extension.
 * Implements the British Auction extension rules:
 * - ANY_BID: Any bid within trigger window extends the auction
 * - L1_CHANGE: Only extends if bid becomes new lowest price
 * - RANK_CHANGE: Extends if bid changes supplier rankings
 *
 * Returns an object with the new close time and string reason, or null.
 */
export async function evaluateExtension(
  tx: any,
  rfqId: number,
  supplierId: number,
  bidPrice: number,
  bidTimestamp: Date
): Promise<{ newClose: Date, reason: string } | null> {
  const rfq = await tx.rfq.findUnique({ where: { id: rfqId } });
  if (!rfq) return null;

  // Reject bids outside the active window.
  if (bidTimestamp < rfq.start_time || bidTimestamp > rfq.close_time) {
    throw { status: 400, message: 'Auction is not currently active' };
  }

  const triggerWindowMs = rfq.trigger_window_mins * 60 * 1000;
  const isWithinTriggerWindow = rfq.close_time.getTime() - bidTimestamp.getTime() <= triggerWindowMs;

  if (!isWithinTriggerWindow) return null;

  let shouldExtend = false;
  let reasonString = '';

  if (rfq.trigger_type === 'ANY_BID') {
    shouldExtend = true;
    reasonString = 'Extended due to ANY_BID rules';
  } else {
    // We need to calculate the current leaderboard state *before* this bid conceptually.
    // Fetch the lowest active bid per supplier for this RFQ.
    const allBids = await tx.bid.groupBy({
      by: ['supplierId'],
      where: { rfqId },
      _min: { price: true },
    });

    const leaderboard = allBids
      .map((b: any) => ({ supplierId: b.supplierId, lowest: b._min.price }))
      .sort((a: any, b: any) => a.lowest - b.lowest);

    if (rfq.trigger_type === 'L1_CHANGE') {
      const currentL1 = leaderboard.length > 0 ? leaderboard[0] : null;
      if (!currentL1 || bidPrice < currentL1.lowest) {
        shouldExtend = true;
        reasonString = 'Extended due to L1_CHANGE: Supplier claimed 1st place rank';
      }
    } else if (rfq.trigger_type === 'RANK_CHANGE') {
      const currentRankIndex = leaderboard.findIndex((s: any) => s.supplierId === supplierId);
      
      // If they had no previous rank, and there are people on the board, they might displace someone immediately.
      // But let's build the "hypothetical" next leaderboard
      const hypotheticalBoard = [...leaderboard];
      if (currentRankIndex > -1) {
        // Only updates their own score if they improved it
        if (bidPrice < hypotheticalBoard[currentRankIndex].lowest) {
           hypotheticalBoard[currentRankIndex].lowest = bidPrice;
        }
      } else {
        hypotheticalBoard.push({ supplierId, lowest: bidPrice });
      }

      hypotheticalBoard.sort((a: any, b: any) => a.lowest - b.lowest);
      const newRankIndex = hypotheticalBoard.findIndex((s: any) => s.supplierId === supplierId);

      // If they were not on the board before, and now they placed above SOMEONE
      if (currentRankIndex === -1 && newRankIndex < hypotheticalBoard.length - 1) {
        shouldExtend = true;
      } else if (currentRankIndex > -1 && newRankIndex < currentRankIndex) {
        // They moved up in rank
        shouldExtend = true;
      }
      
      if (shouldExtend) {
         reasonString = `Extended due to RANK_CHANGE: Ranked moved up to position ${newRankIndex + 1}`;
      }
    }
  }

  if (shouldExtend) {
    const extMs = rfq.extension_mins * 60 * 1000;
    let newClose = new Date(rfq.close_time.getTime() + extMs);

    // Strict cap by forced close time.
    if (newClose > rfq.forced_close_time) {
      newClose = rfq.forced_close_time;
    }

    if (newClose > rfq.close_time) {
      return { newClose, reason: reasonString };
    }
  }

  return null;
}
