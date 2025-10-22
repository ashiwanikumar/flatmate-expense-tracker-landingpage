import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8004/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
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
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data: any) => api.post('/auth/register', data),
  login: (data: any) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
};

// CSV API
export const csvAPI = {
  upload: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/csv/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  getAll: () => api.get('/csv'),
  getOne: (id: string) => api.get(`/csv/${id}`),
  getStats: (id: string) => api.get(`/csv/${id}/stats`),
  reset: (id: string) => api.post(`/csv/${id}/reset`),
  delete: (id: string) => api.delete(`/csv/${id}`),
};

// Campaign API
export const campaignAPI = {
  calculatePlan: (data: any) => api.post('/campaigns/calculate-plan', data),
  create: (data: any) => api.post('/campaigns', data),
  getAll: (params?: any) => api.get('/campaigns', { params }),
  getOne: (id: string) => api.get(`/campaigns/${id}`),
  updateStatus: (id: string, data: any) => api.patch(`/campaigns/${id}/status`, data),
  delete: (id: string) => api.delete(`/campaigns/${id}`),
  getStats: (params?: any) => api.get('/campaigns/stats', { params }),
  getConfig: () => api.get('/campaigns/config'),
  updateConfig: (data: any) => api.put('/campaigns/config', data),
};

// Dashboard API
export const dashboardAPI = {
  getOverview: () => api.get('/dashboard/overview'),
  getTimeline: (days?: number) => api.get('/dashboard/timeline', { params: { days } }),
  getAnalytics: (csvFileId?: string) => api.get('/dashboard/analytics', { params: { csvFileId } }),
};

// Company Account API
export const companyAccountAPI = {
  getAll: () => api.get('/company-accounts'),
  getOne: (id: string) => api.get(`/company-accounts/${id}`),
  create: (data: any) => api.post('/company-accounts', data),
  update: (id: string, data: any) => api.put(`/company-accounts/${id}`, data),
  delete: (id: string) => api.delete(`/company-accounts/${id}`),
  testConnection: (id: string) => api.post(`/company-accounts/${id}/test`),
};

export default api;
