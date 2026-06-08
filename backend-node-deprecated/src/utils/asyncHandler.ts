import { Request, Response, NextFunction, RequestHandler } from "express";

/**
 * A wrapper to catch async errors in Express routes and pass them to the global error handler.
 */
export const asyncHandler = (
  requestHandler: (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => Promise<any>,
): RequestHandler => {
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
  };
};
