import axios from 'axios';
import type { ApiResponse, KioskUser, TimeEntry } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Create a separate axios instance for kiosk (no JWT auth)
const kioskApi = axios.create({
  baseURL: `${API_BASE_URL}/kiosk`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add PIN header to all requests (except validate-pin)
kioskApi.interceptors.request.use((config) => {
  const pin = sessionStorage.getItem('kiosk_pin');
  if (pin) {
    config.headers['X-Kiosk-Pin'] = pin;
  }
  return config;
});

export const kioskService = {
  async validatePin(pin: string): Promise<boolean> {
    try {
      const response = await axios.post<ApiResponse<{ valid: boolean }>>(
        `${API_BASE_URL}/kiosk/validate-pin`,
        { pin }
      );
      return response.data.success && response.data.data?.valid === true;
    } catch {
      return false;
    }
  },

  async getUsers(): Promise<KioskUser[]> {
    const response = await kioskApi.get<ApiResponse<KioskUser[]>>('/users');
    return response.data.data || [];
  },

  async clockIn(userId: string): Promise<TimeEntry> {
    const response = await kioskApi.post<ApiResponse<TimeEntry>>(`/clock-in/${userId}`);
    return response.data.data!;
  },

  async clockOut(userId: string): Promise<TimeEntry> {
    const response = await kioskApi.post<ApiResponse<TimeEntry>>(`/clock-out/${userId}`);
    return response.data.data!;
  },
};
