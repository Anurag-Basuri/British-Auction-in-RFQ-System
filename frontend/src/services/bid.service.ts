import { apiClient } from '../lib/api-client';
import type { CreateBidDto, BidResult } from '../types/api';

export const bidService = {
  placeBid: async (rfqId: number, data: CreateBidDto): Promise<BidResult> => {
    return apiClient.post(`/rfq/${rfqId}/bid`, data);
  }
};
