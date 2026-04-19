import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import * as bidService from "../services/bid.service.js";
import { scheduleClosure } from "../scheduler/queue.js";
import { broadcastToRfq } from "../lib/socket.js";

export const createBidController = asyncHandler(
  async (req: Request, res: Response) => {
    const rfqId = +req.params.rfqId;
    const user = (req as any).user;

    const {
      freight_charges,
      origin_charges,
      destination_charges,
      transit_time,
      quote_validity,
      client_bid_id,
    } = req.body;

    const result = await bidService.createBid(rfqId, user.sub, {
      freight_charges,
      origin_charges,
      destination_charges,
      transit_time,
      quote_validity: new Date(quote_validity),
      client_bid_id,
    });

    if (result.close_time) {
      await scheduleClosure(rfqId, result.close_time);
      broadcastToRfq(rfqId, "AUCTION_EXTENDED", {
        new_close: result.close_time,
      });
    }

    broadcastToRfq(rfqId, "BID_PLACED", result.bid);

    res
      .status(201)
      .json(new ApiResponse(201, result, "Bid placed successfully"));
  },
);
