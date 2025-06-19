const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.token = localStorage.getItem('auth_token');
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const config: RequestInit = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Network error' }));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Auth methods
  async login(email: string, password: string) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    if (response.token) {
      this.setToken(response.token);
    }
    
    return response;
  }

  async register(email: string, password: string, fullName: string, phone?: string) {
    const response = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, fullName, phone }),
    });
    
    if (response.token) {
      this.setToken(response.token);
    }
    
    return response;
  }

  // Employee methods
  async getEmployees(params?: { division?: string; status?: string; search?: string }) {
    const queryParams = new URLSearchParams();
    if (params?.division) queryParams.append('division', params.division);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.search) queryParams.append('search', params.search);
    
    const query = queryParams.toString();
    return this.request(`/employees${query ? `?${query}` : ''}`);
  }

  async getEmployeeProfile() {
    return this.request('/employees/profile/me');
  }

  async createEmployee(employeeData: any) {
    return this.request('/employees', {
      method: 'POST',
      body: JSON.stringify(employeeData),
    });
  }

  async updateEmployee(id: string, updates: any) {
    return this.request(`/employees/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  // Attendance methods
  async getAttendanceRecords(params?: { employeeId?: string; startDate?: string; endDate?: string; limit?: number }) {
    const queryParams = new URLSearchParams();
    if (params?.employeeId) queryParams.append('employeeId', params.employeeId);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const query = queryParams.toString();
    return this.request(`/attendance${query ? `?${query}` : ''}`);
  }

  async getTodayAttendance(employeeId: string) {
    return this.request(`/attendance/today/${employeeId}`);
  }

  async clockIn(employeeId: string, location?: string, photoUrl?: string) {
    return this.request('/attendance/clock-in', {
      method: 'POST',
      body: JSON.stringify({ employeeId, location, photoUrl }),
    });
  }

  async clockOut(employeeId: string, location?: string, photoUrl?: string) {
    return this.request('/attendance/clock-out', {
      method: 'POST',
      body: JSON.stringify({ employeeId, location, photoUrl }),
    });
  }

  async getAttendanceStats(employeeId: string, month?: number, year?: number) {
    const queryParams = new URLSearchParams();
    if (month) queryParams.append('month', month.toString());
    if (year) queryParams.append('year', year.toString());
    
    const query = queryParams.toString();
    return this.request(`/attendance/stats/${employeeId}${query ? `?${query}` : ''}`);
  }

  // Leave methods
  async getLeaveRequests(params?: { employeeId?: string; status?: string; startDate?: string; endDate?: string }) {
    const queryParams = new URLSearchParams();
    if (params?.employeeId) queryParams.append('employeeId', params.employeeId);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    
    const query = queryParams.toString();
    return this.request(`/leave${query ? `?${query}` : ''}`);
  }

  async createLeaveRequest(leaveData: any) {
    return this.request('/leave', {
      method: 'POST',
      body: JSON.stringify(leaveData),
    });
  }

  async updateLeaveRequestStatus(id: string, status: string, rejectionReason?: string) {
    return this.request(`/leave/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, rejectionReason }),
    });
  }

  async getLeaveBalance(employeeId: string, year?: number) {
    const queryParams = new URLSearchParams();
    if (year) queryParams.append('year', year.toString());
    
    const query = queryParams.toString();
    return this.request(`/leave/balance/${employeeId}${query ? `?${query}` : ''}`);
  }

  // Announcement methods
  async getAnnouncements(params?: { type?: string; limit?: number }) {
    const queryParams = new URLSearchParams();
    if (params?.type) queryParams.append('type', params.type);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const query = queryParams.toString();
    return this.request(`/announcements${query ? `?${query}` : ''}`);
  }

  async createAnnouncement(announcementData: any) {
    return this.request('/announcements', {
      method: 'POST',
      body: JSON.stringify(announcementData),
    });
  }

  async updateAnnouncement(id: string, updates: any) {
    return this.request(`/announcements/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteAnnouncement(id: string) {
    return this.request(`/announcements/${id}`, {
      method: 'DELETE',
    });
  }

  // Division methods
  async getDivisions() {
    return this.request('/divisions');
  }

  async createDivision(divisionData: any) {
    return this.request('/divisions', {
      method: 'POST',
      body: JSON.stringify(divisionData),
    });
  }

  // Document methods
  async getDocuments(params?: { employeeId?: string; documentType?: string }) {
    const queryParams = new URLSearchParams();
    if (params?.employeeId) queryParams.append('employeeId', params.employeeId);
    if (params?.documentType) queryParams.append('documentType', params.documentType);
    
    const query = queryParams.toString();
    return this.request(`/documents${query ? `?${query}` : ''}`);
  }

  async uploadDocument(documentData: any) {
    return this.request('/documents', {
      method: 'POST',
      body: JSON.stringify(documentData),
    });
  }

  async deleteDocument(id: string) {
    return this.request(`/documents/${id}`, {
      method: 'DELETE',
    });
  }

  // Payroll methods
  async getSalaryRecords(params?: { employeeId?: string; year?: number; month?: number }) {
    const queryParams = new URLSearchParams();
    if (params?.employeeId) queryParams.append('employeeId', params.employeeId);
    if (params?.year) queryParams.append('year', params.year.toString());
    if (params?.month) queryParams.append('month', params.month.toString());
    
    const query = queryParams.toString();
    return this.request(`/payroll/salary-records${query ? `?${query}` : ''}`);
  }

  async getPayrollComponents() {
    return this.request('/payroll/components');
  }

  async createSalaryRecord(salaryData: any) {
    return this.request('/payroll/salary-records', {
      method: 'POST',
      body: JSON.stringify(salaryData),
    });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
export default apiClient;