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

// Activity Log API
export const activityLogAPI = {
  getAll: (params?: any) => api.get('/activity-logs', { params }),
  getMyActivity: (params?: any) => api.get('/activity-logs/my-activity', { params }),
  getRecent: (limit?: number) => api.get('/activity-logs/recent', { params: { limit } }),
  getStats: (params?: any) => api.get('/activity-logs/stats', { params }),
  exportCSV: () => api.get('/activity-logs/export', { responseType: 'text' }),
};

// OTP API
export const otpAPI = {
  sendOTP: (data: { email: string }) => api.post('/otp/send', data),
  verifyOTP: (data: { email: string; otp: string }) => api.post('/otp/verify', data),
  checkSession: (email: string) => api.get('/otp/session', { params: { email } }),
};

// Invitation API
export const invitationAPI = {
  send: (data: { email: string; role?: string; metadata?: any }) => api.post('/invitations', data),
  getAll: (params?: any) => api.get('/invitations', { params }),
  getByToken: (token: string) => api.get(`/invitations/${token}`),
  accept: (token: string, data: { name: string; password: string }) => api.post(`/invitations/${token}/accept`, data),
  cancel: (id: string) => api.delete(`/invitations/${id}`),
  resend: (id: string) => api.post(`/invitations/${id}/resend`),
};

// Expense API
export const expenseAPI = {
  create: (data: FormData) => api.post('/expenses', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getAll: (params?: any) => api.get('/expenses', { params }),
  getMyExpenses: (params?: any) => api.get('/expenses/my-expenses', { params }),
  getById: (id: string) => api.get(`/expenses/${id}`),
  update: (id: string, data: FormData) => api.put(`/expenses/${id}`, data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  delete: (id: string) => api.delete(`/expenses/${id}`),
  markSplitAsPaid: (expenseId: string, userId: string) => api.post(`/expenses/${expenseId}/mark-paid/${userId}`),
  getStats: (params?: any) => api.get('/expenses/stats/summary', { params }),
  getAvailableUsers: (date: string) => api.get(`/expenses/available-users/${date}`),
};

// User Availability API
export const userAvailabilityAPI = {
  create: (data: any) => api.post('/user-availability', data),
  getAll: (params?: any) => api.get('/user-availability', { params }),
  getById: (id: string) => api.get(`/user-availability/${id}`),
  update: (id: string, data: any) => api.put(`/user-availability/${id}`, data),
  delete: (id: string) => api.delete(`/user-availability/${id}`),
  checkAvailability: (userId: string, date: string) => api.get(`/user-availability/check/${userId}/${date}`),
  getAvailableUsers: (date: string) => api.get(`/user-availability/available/${date}`),
  getCurrentStatus: () => api.get('/user-availability/status/current'),
};

// Balance API
export const balanceAPI = {
  getMyBalance: (year: number, month: number) => api.get(`/balances/my-balance/${year}/${month}`),
  getMonthlyBalances: (year: number, month: number) => api.get(`/balances/monthly/${year}/${month}`),
  getSettlements: (year: number, month: number) => api.get(`/balances/settlements/${year}/${month}`),
  getUserAvailability: (userId: string, year: number, month: number) => api.get(`/balances/availability/${userId}/${year}/${month}`),
};

// Meal Rating API
export const mealRatingAPI = {
  create: (data: any) => api.post('/meal-ratings', data),
  getAll: (params?: any) => api.get('/meal-ratings', { params }),
  getMyRatings: (params?: any) => api.get('/meal-ratings/my-ratings', { params }),
  getById: (id: string) => api.get(`/meal-ratings/${id}`),
  getByMenu: (menuId: string) => api.get(`/meal-ratings/menu/${menuId}`),
  update: (id: string, data: any) => api.put(`/meal-ratings/${id}`, data),
  delete: (id: string) => api.delete(`/meal-ratings/${id}`),
  getStats: (params?: any) => api.get('/meal-ratings/stats/summary', { params }),
};

// Dinner Menu API
export const dinnerMenuAPI = {
  create: (data: any) => api.post('/menus', data),
  getAll: (params?: any) => api.get('/menus', { params }),
  getById: (id: string) => api.get(`/menus/${id}`),
  getUpcoming: (params?: { days?: number; mealType?: string }) => api.get('/menus/upcoming', { params }),
  getToday: (params?: { mealType?: string }) => api.get('/menus/today', { params }),
  getByDate: (date: string, params?: { mealType?: string }) => api.get(`/menus/date/${date}`, { params }),
  update: (id: string, data: any) => api.put(`/menus/${id}`, data),
  updateStatus: (id: string, status: string) => api.patch(`/menus/${id}/status`, { status }),
  delete: (id: string) => api.delete(`/menus/${id}`),
  getStats: (params?: any) => api.get('/menus/stats', { params }),
};

// Food Photo API
export const foodPhotoAPI = {
  upload: (formData: FormData) => api.post('/food-photos', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getAll: (params?: any) => api.get('/food-photos', { params }),
  getById: (id: string) => api.get(`/food-photos/${id}`),
  getByMenu: (menuId: string) => api.get(`/food-photos/menu/${menuId}`),
  getByUser: (userId: string) => api.get(`/food-photos/user/${userId}`),
  getRecent: (params?: { limit?: number }) => api.get('/food-photos/recent', { params }),
  update: (id: string, data: any) => api.put(`/food-photos/${id}`, data),
  delete: (id: string) => api.delete(`/food-photos/${id}`),
  addLike: (id: string) => api.post(`/food-photos/${id}/like`),
  removeLike: (id: string) => api.delete(`/food-photos/${id}/like`),
  addComment: (id: string, text: string) => api.post(`/food-photos/${id}/comments`, { text }),
  removeComment: (id: string, commentId: string) => api.delete(`/food-photos/${id}/comments/${commentId}`),
  getStats: (params?: any) => api.get('/food-photos/stats', { params }),
};

export default api;
