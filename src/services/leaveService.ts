import axiosInstance from '../lib/axiosInstance';

export interface LeaveRequest {
  id: string;
  employee_id: string;
  leave_type: 'annual' | 'sick' | 'emergency' | 'maternity' | 'paternity' | 'other';
  start_date: string;
  end_date: string;
  days_requested: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  approver_id?: string;
  approved_at?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
  employee_id_display?: string;
  position?: string;
  full_name?: string;
  avatar_url?: string;
  approver_name?: string;
}

export interface LeaveBalance {
  entitlements: Record<string, number>;
  used: Record<string, number>;
  balance: Record<string, number>;
}

export class LeaveService {
  static async getLeaveRequests(params?: {
    employeeId?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<LeaveRequest[]> {
    try {
      const response = await axiosInstance.get('/leave', { params });
      return response.data.data || [];
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch leave requests');
    }
  }

  static async createLeaveRequest(leaveData: {
    employeeId: string;
    leaveType: string;
    startDate: string;
    endDate: string;
    reason: string;
  }): Promise<LeaveRequest> {
    try {
      const response = await axiosInstance.post('/leave', leaveData);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to create leave request');
    }
  }

  static async updateLeaveRequestStatus(
    id: string,
    status: 'approved' | 'rejected',
    rejectionReason?: string
  ): Promise<LeaveRequest> {
    try {
      const response = await axiosInstance.put(`/leave/${id}/status`, {
        status,
        rejectionReason
      });
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update leave request');
    }
  }

  static async getLeaveBalance(employeeId: string, year?: number): Promise<LeaveBalance> {
    try {
      const params: any = {};
      if (year) params.year = year;

      const response = await axiosInstance.get(`/leave/balance/${employeeId}`, { params });
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch leave balance');
    }
  }
}