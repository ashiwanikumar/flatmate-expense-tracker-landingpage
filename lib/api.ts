import axios from 'axios';
import { detectIPv4, getCachedIPv4 } from './ipv4Detection';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8004/api/v1';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Start detecting IPv4 on initialization (non-blocking)
if (typeof window !== 'undefined') {
  detectIPv4().catch(err => {
    console.warn('Background IPv4 detection failed:', err);
  });
}

// Request interceptor to add auth token and IPv4 header
api.interceptors.request.use(
  async (config) => {
    // Add auth token
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add IPv4 address header (try cached first, then detect if not available)
    let ipv4 = getCachedIPv4();
    if (!ipv4) {
      try {
        ipv4 = await detectIPv4();
      } catch (error) {
        console.warn('IPv4 detection failed:', error);
      }
    }

    if (ipv4) {
      config.headers['X-Client-IPv4'] = ipv4;
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
  changePassword: (data: any) => api.put('/auth/change-password', data),
  forgotPassword: (data: any) => api.post('/auth/forgot-password', data),
  resetPassword: (token: string, data: any) => api.put(`/auth/reset-password/${token}`, data),
};

// CSV API
export const csvAPI = {
  upload: (file: File, tag?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    if (tag) {
      formData.append('tag', tag);
    }
    return api.post('/csv/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  getAll: () => api.get('/csv'),
  getOne: (id: string) => api.get(`/csv/${id}`),
  getStats: (id: string) => api.get(`/csv/${id}/stats`),
  getData: (id: string) => api.get(`/csv/${id}/data`),
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
  cancel: (id: string) => api.post(`/campaigns/${id}/cancel`),
  pause: (id: string) => api.post(`/campaigns/${id}/pause`),
  resume: (id: string) => api.post(`/campaigns/${id}/resume`),
  reschedule: (id: string, data: { scheduledDate: string }) => api.patch(`/campaigns/${id}/reschedule`, data),
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

// Campaign Template API
export const campaignTemplateAPI = {
  getAll: (companyAccountId: string) => api.get(`/campaign-templates/company/${companyAccountId}`),
  getOne: (templateId: string) => api.get(`/campaign-templates/${templateId}`),
  create: (companyAccountId: string, data: any) => api.post(`/campaign-templates/company/${companyAccountId}`, data),
  update: (templateId: string, data: any) => api.put(`/campaign-templates/${templateId}`, data),
  delete: (templateId: string) => api.delete(`/campaign-templates/${templateId}`),
  setDefault: (templateId: string) => api.patch(`/campaign-templates/${templateId}/set-default`),
};

// Activity Log API
export const activityLogAPI = {
  getAll: (params?: any) => api.get('/activity-logs', { params }),
  getMyActivity: (params?: any) => api.get('/activity-logs/my-activity', { params }),
  getRecent: (limit?: number) => api.get('/activity-logs/recent', { params: { limit } }),
  getStats: (params?: any) => api.get('/activity-logs/stats', { params }),
  exportCSV: () => api.get('/activity-logs/export', { responseType: 'text' }),
};

export default api;
