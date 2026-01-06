import api from '../lib/axios';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export interface EventRequest {
  id: string;
  code: string;
  status: 'pending' | 'approved' | 'rejected' | 'changes_requested';

  // Organización
  tipoOrganizacion: 'facultad' | 'departamento';
  facultad?: string;
  facultadCarrera?: string;
  departamentoNombre?: string;

  // Solicitante
  solicitanteNombre: string;
  solicitanteCargo: string;
  solicitanteEmail: string;
  solicitanteTelefono: string;

  // Evento
  eventoNombre: string;
  eventoTipo: string;
  eventoTipoOtro?: string;
  eventoFecha: string;
  eventoHoraInicio: string;
  eventoHoraFin: string;
  eventoUbicacion: string;
  eventoAsistentes?: number;

  // Servicios
  servicioFotografia: boolean;
  servicioVideo: boolean;

  // Detalles
  descripcion?: string;
  requerimientosEspeciales?: string;
  notasInternas?: string;
  mensajeSolicitante?: string;
  eventId?: string;
  ipAddress?: string;
  createdAt: string;
  respondedAt?: string;
}

export interface EventRequestConfig {
  id: string;
  accessCode: string;
  isActive: boolean;
  rateLimit: number;
}

export interface EventRequestStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  changesRequested: number;
}

export interface TokenRecoveryRequest {
  id: string;
  email: string;
  token: string | null;
  status: 'pending' | 'sent' | 'not_found';
  createdAt: string;
  sentAt?: string;
}

// Cliente publico (sin auth)
const publicApi = axios.create({
  baseURL: API_URL
});

export const eventRequestService = {
  // ========== PUBLICO ==========

  async validateAccessCode(code: string): Promise<boolean> {
    const response = await publicApi.get(`/event-requests/public/validate/${code}`);
    return response.data.data.isValid;
  },

  async submitRequest(accessCode: string, data: Partial<EventRequest>): Promise<{ code: string; token: string }> {
    const response = await publicApi.post(`/event-requests/public/submit/${accessCode}`, data);
    return response.data.data;
  },

  async getMyRequests(token: string): Promise<{ email: string; requests: EventRequest[] }> {
    const response = await publicApi.get(`/event-requests/public/my-requests/${token}`);
    return response.data.data;
  },

  async recoverAccess(email: string): Promise<void> {
    await publicApi.post('/event-requests/public/recover-access', { email });
  },

  async getStatusByCode(code: string): Promise<Partial<EventRequest>> {
    const response = await publicApi.get(`/event-requests/public/status/${code}`);
    return response.data.data;
  },

  async updateRequest(id: string, token: string, data: Partial<EventRequest>): Promise<EventRequest> {
    const response = await publicApi.put(`/event-requests/public/update/${id}`, { token, ...data });
    return response.data.data;
  },

  // ========== ADMIN ==========

  async getAll(params?: { status?: string; limit?: number }): Promise<EventRequest[]> {
    const response = await api.get('/event-requests', { params });
    return response.data.data;
  },

  async getPending(): Promise<EventRequest[]> {
    const response = await api.get('/event-requests/pending');
    return response.data.data;
  },

  async getStats(): Promise<EventRequestStats> {
    const response = await api.get('/event-requests/stats');
    return response.data.data;
  },

  async getById(id: string): Promise<EventRequest> {
    const response = await api.get(`/event-requests/${id}`);
    return response.data.data;
  },

  async approve(id: string, data: { notasInternas?: string; mensajeSolicitante?: string }): Promise<EventRequest> {
    const response = await api.post(`/event-requests/${id}/approve`, data);
    return response.data.data;
  },

  async reject(id: string, data: { notasInternas?: string; mensajeSolicitante?: string }): Promise<EventRequest> {
    const response = await api.post(`/event-requests/${id}/reject`, data);
    return response.data.data;
  },

  async requestChanges(id: string, data: { notasInternas?: string; mensajeSolicitante?: string }): Promise<EventRequest> {
    const response = await api.post(`/event-requests/${id}/request-changes`, data);
    return response.data.data;
  },

  async getConfig(): Promise<EventRequestConfig> {
    const response = await api.get('/event-requests/config');
    return response.data.data;
  },

  async updateConfig(data: Partial<EventRequestConfig>): Promise<EventRequestConfig> {
    const response = await api.put('/event-requests/config', data);
    return response.data.data;
  },

  // ========== RECUPERACION DE TOKENS ==========

  async getRecoveryRequests(): Promise<TokenRecoveryRequest[]> {
    const response = await api.get('/event-requests/recovery');
    return response.data.data;
  },

  async markRecoveryAsSent(id: string): Promise<TokenRecoveryRequest> {
    const response = await api.post(`/event-requests/recovery/${id}/sent`);
    return response.data.data;
  },

  async deleteRecoveryRequest(id: string): Promise<void> {
    await api.delete(`/event-requests/recovery/${id}`);
  }
};
