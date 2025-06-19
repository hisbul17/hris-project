import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { apiClient } from '../lib/api';

interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  role: 'admin' | 'manager' | 'employee';
  avatarUrl?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string, phone?: string) => Promise<any>;
  signIn: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<void>;
  updateProfile: (updates: any) => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('auth_token');
    if (token) {
      apiClient.setToken(token);
      // You might want to validate the token here by making a request to get user profile
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, []);

  const signUp = async (email: string, password: string, fullName: string, phone?: string) => {
    const response = await apiClient.register(email, password, fullName, phone);
    if (response.user) {
      setUser(response.user);
    }
    return response;
  };

  const signIn = async (email: string, password: string) => {
    const response = await apiClient.login(email, password);
    if (response.user) {
      setUser(response.user);
    }
    return response;
  };

  const signOut = async () => {
    apiClient.clearToken();
    setUser(null);
  };

  const updateProfile = async (updates: any) => {
    // This would need to be implemented in the backend
    // For now, just update local state
    if (user) {
      setUser({ ...user, ...updates });
    }
    return updates;
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      signUp,
      signIn,
      signOut,
      updateProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}