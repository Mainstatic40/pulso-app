import api from '../lib/axios';
import type { ApiResponse, Attachment } from '../types';

export const attachmentService = {
  async upload(files: File[], options: { taskId?: string; eventId?: string }) {
    const formData = new FormData();

    files.forEach((file) => {
      formData.append('files', file);
    });

    if (options.taskId) {
      formData.append('taskId', options.taskId);
    }
    if (options.eventId) {
      formData.append('eventId', options.eventId);
    }

    const response = await api.post<ApiResponse<Attachment[]>>('/attachments', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data.data!;
  },

  async getByTask(taskId: string) {
    const response = await api.get<ApiResponse<Attachment[]>>(`/attachments/task/${taskId}`);
    return response.data.data!;
  },

  async getByEvent(eventId: string) {
    const response = await api.get<ApiResponse<Attachment[]>>(`/attachments/event/${eventId}`);
    return response.data.data!;
  },

  async delete(attachmentId: string) {
    const response = await api.delete<ApiResponse<{ message: string }>>(`/attachments/${attachmentId}`);
    return response.data.data!;
  },

  async download(attachmentId: string, filename: string) {
    try {
      // Use axios with blob response type to include auth headers
      const response = await api.get(`/attachments/${attachmentId}/download`, {
        responseType: 'blob',
      });

      // Create a blob URL and trigger download
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up the blob URL
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
      throw error;
    }
  },

  async getPreviewUrl(attachmentId: string): Promise<string> {
    // Use axios with blob response type to include auth headers
    const response = await api.get(`/attachments/${attachmentId}/preview`, {
      responseType: 'blob',
    });

    // Create a blob URL for preview
    const blob = new Blob([response.data], { type: response.headers['content-type'] });
    return window.URL.createObjectURL(blob);
  },

  // Check if file type supports preview
  canPreview(mimeType: string): boolean {
    const previewableMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'video/mp4',
      'video/quicktime',
      'text/plain',
    ];
    return previewableMimeTypes.includes(mimeType);
  },
};
