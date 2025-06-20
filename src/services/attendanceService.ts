import axiosInstance from '../lib/axiosInstance';

export interface AttendanceRecord {
  id: string;
  employee_id: string;
  date: string;
  clock_in?: string;
  clock_out?: string;
  clock_in_location?: string;
  clock_out_location?: string;
  clock_in_photo?: string;
  clock_out_photo?: string;
  status: 'present' | 'absent' | 'late' | 'half_day';
  notes?: string;
  created_at: string;
  updated_at: string;
  employee_id_display?: string;
  full_name?: string;
}

export interface AttendanceStats {
  total_days: number;
  present_days: number;
  late_days: number;
  absent_days: number;
  average_hours: number;
}

export class AttendanceService {
  static async getAttendanceRecords(params?: {
    employeeId?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }): Promise<AttendanceRecord[]> {
    try {
      const response = await axiosInstance.get('/attendance', { params });
      return response.data.data || [];
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch attendance records');
    }
  }

  static async getTodayAttendance(employeeId: string): Promise<AttendanceRecord | null> {
    try {
      const response = await axiosInstance.get(`/attendance/today/${employeeId}`);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch today attendance');
    }
  }

  static async clockIn(employeeId: string, location?: string, photoUrl?: string): Promise<AttendanceRecord> {
    try {
      const response = await axiosInstance.post('/attendance/clock-in', {
        employeeId,
        location,
        photoUrl
      });
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to clock in');
    }
  }

  static async clockOut(employeeId: string, location?: string, photoUrl?: string): Promise<AttendanceRecord> {
    try {
      const response = await axiosInstance.post('/attendance/clock-out', {
        employeeId,
        location,
        photoUrl
      });
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to clock out');
    }
  }

  static async getAttendanceStats(employeeId: string, month?: number, year?: number): Promise<AttendanceStats> {
    try {
      const params: any = {};
      if (month) params.month = month;
      if (year) params.year = year;

      const response = await axiosInstance.get(`/attendance/stats/${employeeId}`, { params });
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch attendance statistics');
    }
  }
}