import api from '../lib/axios';
import type { ApiResponse } from '../types';

export interface RfidUser {
  id: string;
  name: string;
  email: string;
  role: string;
  rfidTag: string | null;
  hasRfid: boolean;
  profileImage?: string;
}

export interface RfidScanResult {
  action: 'clock_in' | 'clock_out';
  user: { id: string; name: string; email: string };
  timeEntry: {
    id: string;
    clockIn: string;
    clockOut: string | null;
    totalHours: number | null;
  };
  message: string;
}

export interface RfidCheckResult {
  isAssigned: boolean;
  user: { id: string; name: string; email: string } | null;
}

export const rfidService = {
  // Simular escaneo RFID (para pruebas)
  async scan(rfidTag: string): Promise<RfidScanResult> {
    const response = await api.post<ApiResponse<RfidScanResult>>('/rfid/scan', { rfidTag });
    return response.data.data!;
  },

  // Obtener usuarios con estado RFID
  async getUsersWithRfid(): Promise<RfidUser[]> {
    const response = await api.get<ApiResponse<RfidUser[]>>('/rfid/users');
    return response.data.data!;
  },

  // Vincular RFID a usuario
  async linkRfid(userId: string, rfidTag: string): Promise<{ id: string; name: string; email: string; rfidTag: string }> {
    const response = await api.post<ApiResponse<{ id: string; name: string; email: string; rfidTag: string }>>(`/rfid/link/${userId}`, { rfidTag });
    return response.data.data!;
  },

  // Desvincular RFID de usuario
  async unlinkRfid(userId: string): Promise<{ id: string; name: string; email: string; rfidTag: null }> {
    const response = await api.delete<ApiResponse<{ id: string; name: string; email: string; rfidTag: null }>>(`/rfid/unlink/${userId}`);
    return response.data.data!;
  },

  // Verificar si RFID está asignado
  async checkRfidTag(rfidTag: string): Promise<RfidCheckResult> {
    const response = await api.get<ApiResponse<RfidCheckResult>>(`/rfid/check/${rfidTag}`);
    return response.data.data!;
  },
};
