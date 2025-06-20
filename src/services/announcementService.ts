import axiosInstance from '../lib/axiosInstance';

export interface Announcement {
  id: string;
  title: string;
  content: string;
  announcement_type: 'general' | 'urgent' | 'event';
  target_roles?: string[];
  target_divisions?: string[];
  published_by: string;
  is_published: boolean;
  published_at?: string;
  expires_at?: string;
  created_at: string;
  updated_at: string;
  author_name?: string;
  author_avatar?: string;
}

export class AnnouncementService {
  static async getAnnouncements(params?: {
    type?: string;
    limit?: number;
  }): Promise<Announcement[]> {
    try {
      const response = await axiosInstance.get('/announcements', { params });
      return response.data.data || [];
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch announcements');
    }
  }

  static async createAnnouncement(announcementData: {
    title: string;
    content: string;
    announcementType: string;
    targetRoles: string[];
    expiresAt?: string;
    isPublished?: boolean;
  }): Promise<Announcement> {
    try {
      const response = await axiosInstance.post('/announcements', announcementData);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to create announcement');
    }
  }

  static async updateAnnouncement(id: string, updates: Partial<Announcement>): Promise<Announcement> {
    try {
      const response = await axiosInstance.put(`/announcements/${id}`, updates);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update announcement');
    }
  }

  static async deleteAnnouncement(id: string): Promise<void> {
    try {
      await axiosInstance.delete(`/announcements/${id}`);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to delete announcement');
    }
  }
}