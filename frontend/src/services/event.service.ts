import api from '../lib/axios';
import type {
  ApiResponse,
  Event,
  EventType,
  EventDayInput,
  EventChecklistItem,
} from '../types';

// Full event with all relations (for detail view)
export type EventWithDetails = Event;

// Event for list views (includes _count)
export interface EventListItem extends Event {
  _count?: {
    days: number;
  };
}

// Backward compatibility alias
export type EventWithRelations = EventListItem;

export interface CreateEventRequest {
  name: string;
  description?: string;
  clientRequirements?: string | null;
  eventType: EventType;
  startDatetime: string;
  endDatetime: string;
  // Preset times for yearbook events
  morningStartTime?: string;
  morningEndTime?: string;
  afternoonStartTime?: string;
  afternoonEndTime?: string;
  usePresetEquipment?: boolean;
  // Preset equipment IDs (for yearbook with preset)
  presetCameraId?: string;
  presetLensId?: string;
  presetAdapterId?: string;
  // Additional equipment (for yearbook - equipment without specific shift)
  additionalEquipmentIds?: string[];
  // Days with shifts (for multi-day events)
  days?: EventDayInput[];
  // Legacy: direct assignees (for backward compatibility)
  assigneeIds?: string[];
}

export interface UpdateEventRequest {
  name?: string;
  description?: string;
  clientRequirements?: string | null;
  eventType?: EventType;
  startDatetime?: string;
  endDatetime?: string;
  // Preset times for yearbook events
  morningStartTime?: string | null;
  morningEndTime?: string | null;
  afternoonStartTime?: string | null;
  afternoonEndTime?: string | null;
  usePresetEquipment?: boolean;
  // Preset equipment IDs (for yearbook with preset)
  presetCameraId?: string;
  presetLensId?: string;
  presetAdapterId?: string;
  // Additional equipment (for yearbook - equipment without specific shift)
  additionalEquipmentIds?: string[];
  // Days with shifts (for multi-day events)
  days?: EventDayInput[];
  // Legacy: direct assignees
  assigneeIds?: string[];
}

export const eventService = {
  async getAll(params?: {
    page?: number;
    limit?: number;
    dateFrom?: string;
    dateTo?: string;
    assigneeId?: string;
    eventType?: EventType;
  }) {
    const response = await api.get<ApiResponse<EventListItem[]>>('/events', { params });
    return response.data;
  },

  async getById(id: string) {
    const response = await api.get<ApiResponse<EventWithDetails>>(`/events/${id}`);
    return response.data.data!;
  },

  async getUpcoming() {
    const response = await api.get<ApiResponse<EventListItem[]>>('/events/upcoming');
    return response.data.data!;
  },

  async create(data: CreateEventRequest) {
    const response = await api.post<ApiResponse<EventWithDetails>>('/events', data);
    return response.data.data!;
  },

  async update(id: string, data: UpdateEventRequest) {
    const response = await api.put<ApiResponse<EventWithDetails>>(`/events/${id}`, data);
    return response.data.data!;
  },

  async delete(id: string) {
    const response = await api.delete<ApiResponse<{ message: string }>>(`/events/${id}`);
    return response.data.data!;
  },

  async releaseEquipment(eventId: string, userId: string) {
    const response = await api.post<ApiResponse<EventWithDetails>>(
      `/events/${eventId}/equipment/${userId}/release`
    );
    return response.data.data!;
  },

  async transferEquipment(eventId: string, fromUserId: string, toUserId: string) {
    const response = await api.post<ApiResponse<EventWithDetails>>(
      `/events/${eventId}/equipment/${fromUserId}/transfer`,
      { toUserId }
    );
    return response.data.data!;
  },

  // Checklist methods
  async getChecklist(eventId: string) {
    const response = await api.get<ApiResponse<EventChecklistItem[]>>(`/events/${eventId}/checklist`);
    return response.data.data || [];
  },

  async addChecklistItem(eventId: string, content: string) {
    const response = await api.post<ApiResponse<EventChecklistItem>>(`/events/${eventId}/checklist`, { content });
    return response.data.data!;
  },

  async updateChecklistItem(eventId: string, itemId: string, data: { content?: string; isCompleted?: boolean }) {
    const response = await api.patch<ApiResponse<EventChecklistItem>>(`/events/${eventId}/checklist/${itemId}`, data);
    return response.data.data!;
  },

  async deleteChecklistItem(eventId: string, itemId: string) {
    const response = await api.delete<ApiResponse<{ message: string }>>(`/events/${eventId}/checklist/${itemId}`);
    return response.data.data!;
  },
};
