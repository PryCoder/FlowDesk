import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Interfaces that match your actual API response
export interface RegisterRequest {
  full_name: string;
  email: string;
  password: string;
  department?: string;
  role?: string;
  work_style?: string;
  skills?: string[];
  enable_2fa?: boolean;
  accept_terms?: boolean;
  receive_notifications?: boolean;
  avatar_url?: string;
  dashboard_layout?: string;
  theme?: string;
  wellness_goals?: string[];
  sso_provider?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}

// Updated User interface to match your actual API response
export interface User {
  id: string;
  full_name: string;
  email: string;
  password_hash?: string;
  department?: string;
  role: string;
  work_style?: string;
  skills: string[];
  enable_2fa: boolean;
  receive_notifications: boolean;
  notifications_enabled?: boolean; // For API compatibility
  avatar_url?: string;
  avatar?: string | null; // For API compatibility
  dashboard_layout: string;
  theme: string;
  wellness_goals: string[];
  sso_provider?: string | null;
  company_id?: string | null;
  accept_terms?: boolean;
  created_at: string;
  updated_at: string;
}

// Auth API functions
export const authAPI = {
  register: async (userData: RegisterRequest): Promise<TokenResponse> => {
    const response = await api.post<TokenResponse>('/auth/auth/register', userData);
    
    // Store token on successful registration
    if (response.data.access_token) {
      localStorage.setItem('auth_token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    
    return response.data;
  },

  login: async (credentials: LoginRequest): Promise<TokenResponse> => {
    const response = await api.post<TokenResponse>('/auth/login', credentials);
    
    // Store token on successful login
    if (response.data.access_token) {
      localStorage.setItem('auth_token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    
    return response.data;
  },

  logout: (): void => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await api.get<User>('/users/users/me');
    const userData = response.data;
    
    // Normalize the user data to match our interface
    const normalizedUser: User = {
      ...userData,
      // Map API fields to expected fields
      receive_notifications: userData.notifications_enabled ?? userData.receive_notifications ?? true,
      avatar_url: userData.avatar || userData.avatar_url,
    };
    
    // Update localStorage with normalized user data
    localStorage.setItem('user', JSON.stringify(normalizedUser));
    
    return normalizedUser;
  }
};

// Helper function to check if user is authenticated
export const isAuthenticated = (): boolean => {
  return !!localStorage.getItem('auth_token');
};

// Helper function to get current user from localStorage
export const getCurrentUser = (): User | null => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

export default api;