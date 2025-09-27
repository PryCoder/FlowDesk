import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface RegisterRequest {
  full_name: string;
  email: string;
  password: string;
  department: string;
  role: string;
  work_style: string;
  skills: string[];
  enable_2fa: boolean;
  accept_terms: boolean;
  receive_notifications: boolean;
  avatar?: string;
}

export interface RegisterResponse {
  message: string;
  user: {
    id: string;
    email: string;
    full_name: string;
    department: string;
    role: string;
    work_style: string;
    skills: string[];
    avatar?: string;
    enable_2fa: boolean;
    receive_notifications: boolean;
    created_at: string;
  };
  token: {
    access_token: string;
    token_type: string;
  };
}

export const authAPI = {
  register: async (userData: RegisterRequest): Promise<RegisterResponse> => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },
};