import { AxiosError } from 'axios';

export class ApiError extends Error {
  public statusCode: number;
  public errors?: any;
  public success: boolean;

  constructor(message: string, statusCode: number, errors?: any) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.errors = errors;
    this.success = false;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }

  static from(error: Error | AxiosError | unknown): ApiError {
    if (error instanceof ApiError) return error;

    if (error instanceof AxiosError) {
      const respData = error.response?.data as any;
      const message = respData?.message || error.message || 'An unexpected error occurred';
      const statusCode = error.response?.status || 500;
      const errors = respData?.errors;

      return new ApiError(message, statusCode, errors);
    }

    if (error instanceof Error) {
      return new ApiError(error.message, 500);
    }

    return new ApiError('An unknown error occurred', 500);
  }

  get isUnauthorized() {
    return this.statusCode === 401;
  }

  get isValidation() {
    return this.statusCode === 400 || this.statusCode === 422;
  }
}
