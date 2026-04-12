import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import * as rfqService from '../services/rfq.service.js';

export const createRfqController = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const result = await rfqService.create(user.sub, req.body);
  res.status(201).json(new ApiResponse(201, result, "RFQ created successfully"));
});

export const findAllRfqController = asyncHandler(async (_req: Request, res: Response) => {
  const result = await rfqService.findAll();
  res.status(200).json(new ApiResponse(200, result, "RFQs retrieved successfully"));
});

export const findOneRfqController = asyncHandler(async (req: Request, res: Response) => {
  const result = await rfqService.findOne(+req.params.id);
  res.status(200).json(new ApiResponse(200, result, "RFQ details retrieved successfully"));
});
