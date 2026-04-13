export interface ApiResponse<T> {
  statusCode: number;
  data: T;
  message: string;
  success: boolean;
  errors?: any;
}

export interface User {
  id: number;
  email: string;
  role: "BUYER" | "SUPPLIER";
}

export interface RFQ {
  id: number;
  title: string;
  description: string | null;
  status: "DRAFT" | "ACTIVE" | "CLOSED";
  start_time: string;
  close_time: string;
  forced_close_time: string;
  pickup_date: string | null;
  trigger_window_mins: number;
  extension_mins: number;
  trigger_type: "ANY_BID" | "RANK_CHANGE" | "L1_CHANGE";
  buyerId: number;
  createdAt: string;
  updatedAt: string;
  _count?: {
    bids: number;
  };
}

export interface Bid {
  id: number;
  rfqId: number;
  supplierId: number;
  freight_charges: number;
  origin_charges: number;
  destination_charges: number;
  price: number;
  transit_time: string;
  quote_validity: string;
  timestamp: string;
  supplier?: {
    id: number;
    email: string;
  };
}

export interface ExtensionLog {
  id: number;
  rfqId: number;
  triggerBidId: number | null;
  reason: string;
  extended_mins: number;
  previous_close: string;
  new_close: string;
  createdAt: string;
}

export interface RFQDetail extends RFQ {
  bids: Bid[];
  extensionLogs: ExtensionLog[];
  buyer: {
    id: number;
    email: string;
  };
}

export interface LoginResponse {
  access_token: string;
  user: User;
}

export interface CreateRfqDto {
  title: string;
  description?: string;
  start_time: string;
  close_time: string;
  forced_close_time: string;
  pickup_date?: string;
  trigger_window_mins: number;
  extension_mins: number;
  trigger_type: "ANY_BID" | "RANK_CHANGE" | "L1_CHANGE";
}

export interface CreateBidDto {
  freight_charges: number;
  origin_charges: number;
  destination_charges: number;
  transit_time: string;
  quote_validity: string;
}

export interface BidResult {
  bid: Bid;
  extended: boolean;
  close_time?: Date;
  extension_mins?: number;
}

export interface LoginDto {
  email: string;
  password?: string;
}

export interface GoogleAuthDto {
  token: string;
  role?: "BUYER" | "SUPPLIER";
}

export interface RegisterDto {
  email: string;
  password?: string;
  role: "BUYER" | "SUPPLIER";
}
