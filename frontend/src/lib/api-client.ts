import axios, { AxiosResponse, InternalAxiosRequestConfig } from "axios";
import { ApiError } from "./api-error";

// Custom event to handle logout without circular dependencies
export const AUTH_EXPIRED_EVENT = "auth:expired";

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000",
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor: Attach Token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Only access localStorage in browser environment
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response Interceptor: Unwrap ApiResponse and handle errors
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // If the backend returns our standard ApiResponse enveloped object `{ success, data, message }`
    // We unwrap it and just return `data` to the caller for cleaner components.
    if (response.data && "success" in response.data) {
      return response.data.data;
    }
    return response.data;
  },
  (error) => {
    const apiError = ApiError.from(error);

    if (apiError.isUnauthorized) {
      // Dispatch custom event so the AuthProvider can clear state natively
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
      }
    }

    // Pass the standard ApiError object up
    return Promise.reject(apiError);
  },
);
