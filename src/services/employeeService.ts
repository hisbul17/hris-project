import axiosInstance from '../lib/axiosInstance';

export interface Employee {
  id: string;
  employee_id: string;
  profile_id: string;
  position: string;
  division_id?: string;
  join_date: string;
  employment_status: 'active' | 'inactive' | 'terminated';
  salary_base?: number;
  address?: string;
  emergency_contact?: string;
  emergency_phone?: string;
  full_name?: string;
  email?: string;
  phone?: string;
  avatar_url?: string;
  division_name?: string;
  created_at: string;
  updated_at: string;
}

export interface Division {
  id: string;
  name: string;
  description?: string;
  manager_id?: string;
  manager_name?: string;
  created_at: string;
  updated_at: string;
}

export class EmployeeService {
  static async getEmployees(params?: {
    division?: string;
    status?: string;
    search?: string;
  }): Promise<Employee[]> {
    try {
      const response = await axiosInstance.get('/employees', { params });
      return response.data.data || [];
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch employees');
    }
  }

  static async getEmployeeById(id: string): Promise<Employee> {
    try {
      const response = await axiosInstance.get(`/employees/${id}`);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch employee');
    }
  }

  static async getEmployeeProfile(): Promise<Employee> {
    try {
      const response = await axiosInstance.get('/employees/profile/me');
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch employee profile');
    }
  }

  static async createEmployee(employeeData: Partial<Employee>): Promise<Employee> {
    try {
      const response = await axiosInstance.post('/employees', employeeData);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to create employee');
    }
  }

  static async updateEmployee(id: string, updates: Partial<Employee>): Promise<Employee> {
    try {
      const response = await axiosInstance.put(`/employees/${id}`, updates);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update employee');
    }
  }

  static async getDivisions(): Promise<Division[]> {
    try {
      const response = await axiosInstance.get('/divisions');
      return response.data.data || [];
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch divisions');
    }
  }

  static async createDivision(divisionData: Partial<Division>): Promise<Division> {
    try {
      const response = await axiosInstance.post('/divisions', divisionData);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to create division');
    }
  }
}