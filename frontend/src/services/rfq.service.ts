import { apiClient } from "../lib/api-client";
import type { CreateRfqDto, RFQ, RFQDetail } from "../types/api";

export const rfqService = {
  getAllRfqs: async (): Promise<RFQ[]> => {
    return apiClient.get("/rfq");
  },

  getRfqById: async (id: number): Promise<RFQDetail> => {
    return apiClient.get(`/rfq/${id}`);
  },

  createRfq: async (data: CreateRfqDto): Promise<RFQ> => {
    return apiClient.post("/rfq", data);
  },

  earlyCloseRfq: async (id: number): Promise<void> => {
    return apiClient.post(`/rfq/${id}/close-early`);
  },
};
