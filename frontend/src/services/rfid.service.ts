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
  action: 'clock_in' | 'clock_out' | 'pending';
  user: { id: string; name: string; email: string } | null;
  timeEntry: {
    id: string;
    clockIn: string;
    clockOut: string | null;
    totalHours: number | null;
  } | null;
  message: string;
  rfidTag?: string;
}

export interface RfidCheckResult {
  isAssigned: boolean;
  user: { id: string; name: string; email: string } | null;
}

export interface PendingRfid {
  id: string;
  rfidTag: string;
  scannedAt: string;
  note?: string;
}

export const rfidService = {
  // Simular escaneo RFID (para pruebas desde el navegador)
  async scan(rfidTag: string): Promise<RfidScanResult> {
    const response = await api.post<ApiResponse<RfidScanResult>>(
      '/rfid/scan',
      { rfidTag },
      { headers: { 'x-api-key': 'pulso-rfid-secret-key-2024' } }
    );
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

  // Obtener credenciales pendientes
  async getPending(): Promise<PendingRfid[]> {
    const response = await api.get<ApiResponse<PendingRfid[]>>('/rfid/pending');
    return response.data.data!;
  },

  // Eliminar credencial pendiente
  async deletePending(rfidTag: string): Promise<void> {
    await api.delete(`/rfid/pending/${encodeURIComponent(rfidTag)}`);
  },
};
