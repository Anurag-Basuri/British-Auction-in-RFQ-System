import { apiClient } from '../lib/api-client';
import type { LoginDto, RegisterDto, LoginResponse } from '../types/api';

export const authService = {
  login: async (data: LoginDto): Promise<LoginResponse> => {
    return apiClient.post('/auth/login', data);
  },
  
  register: async (data: RegisterDto): Promise<LoginResponse> => {
    return apiClient.post('/auth/register', data);
  }
};
