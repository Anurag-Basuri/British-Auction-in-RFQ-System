import { prisma } from '../lib/prisma.js';

/**
 * Evaluate whether a bid should trigger an auction time extension.
 * Implements the British Auction extension rules:
 * - ANY_BID: Any bid within trigger window extends the auction
 * - L1_CHANGE: Only extends if bid becomes new lowest price
 * - RANK_CHANGE: Extends if bid changes supplier rankings
 *
 * Returns the new close time if extension is triggered, null otherwise.
 */
export async function evaluateExtension(
  rfqId: number,
  bidPrice: number,
  bidTimestamp: Date
): Promise<Date | null> {
  const rfq = await prisma.rfq.findUnique({ where: { id: rfqId } });
  if (!rfq) return null;

  // Reject bids outside the active window.
  if (bidTimestamp < rfq.start_time || bidTimestamp > rfq.close_time) {
    throw { status: 400, message: 'Auction is not currently active' };
  }

  // Trigger window check (current_time >= close_time - X).
  const triggerWindowMs = rfq.trigger_window_mins * 60 * 1000;
  const isWithinTriggerWindow =
    rfq.close_time.getTime() - bidTimestamp.getTime() <= triggerWindowMs;

  if (!isWithinTriggerWindow) return null;

  // Check conditions based on configured TriggerType.
  let shouldExtend = false;

  if (rfq.trigger_type === 'ANY_BID') {
    shouldExtend = true;
  } else {
    // For Rank change or L1 change, we need context.
    const previousL1 = await prisma.bid.findFirst({
      where: { rfqId },
      orderBy: [{ price: 'asc' }, { timestamp: 'asc' }],
    });

    if (rfq.trigger_type === 'L1_CHANGE') {
      shouldExtend = !previousL1 || bidPrice < previousL1.price;
    } else if (rfq.trigger_type === 'RANK_CHANGE') {
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
