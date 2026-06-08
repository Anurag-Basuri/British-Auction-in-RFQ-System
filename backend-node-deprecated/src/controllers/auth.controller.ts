import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import * as authService from "../services/auth.service.js";

export const registerController = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await authService.register(req.body);
    res
      .status(201)
      .json(new ApiResponse(201, result, "User registered successfully"));
  },
);

export const loginController = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await authService.login(req.body);
    res
      .status(200)
      .json(new ApiResponse(200, result, "User logged in successfully"));
  },
);

export const googleAuthController = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await authService.googleLogin(req.body);
    res
      .status(200)
      .json(new ApiResponse(200, result, "Google authentication successful"));
  },
);
