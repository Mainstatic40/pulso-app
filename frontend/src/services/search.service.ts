import api from '../lib/axios';
import type { ApiResponse } from '../types';

export interface SearchTask {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  dueDate: string;
}

export interface SearchEvent {
  id: string;
  name: string;
  description: string;
  eventType: string;
  startDatetime: string;
  endDatetime: string;
}

export interface SearchUser {
  id: string;
  name: string;
  email: string;
  role: string;
  profileImage: string | null;
}

export interface SearchResults {
  tasks: SearchTask[];
  events: SearchEvent[];
  users: SearchUser[];
}

export const searchService = {
  async search(query: string): Promise<SearchResults> {
    if (!query || query.trim().length < 2) {
      return { tasks: [], events: [], users: [] };
    }

    const response = await api.get<ApiResponse<SearchResults>>('/search', {
      params: { q: query.trim() },
    });

    return response.data.data || { tasks: [], events: [], users: [] };
  },
};
