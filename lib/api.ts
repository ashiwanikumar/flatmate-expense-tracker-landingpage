import axios from 'axios';
import { detectIPv4, getCachedIPv4 } from './ipv4Detection';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

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
  // Public signup
  signup: (data: any) => api.post('/auth/signup', data),
  activateAccount: (token: string) => api.get(`/auth/activate/${token}`),
  resendActivation: (data: { email: string }) => api.post('/auth/resend-activation', data),

  // Admin registration (internal)
  register: (data: any) => api.post('/auth/register', data),

  // Authentication
  login: (data: any) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
  changePassword: (data: any) => api.put('/auth/change-password', data),
  forgotPassword: (data: any) => api.post('/auth/forgot-password', data),
  resetPassword: (token: string, data: any) => api.put(`/auth/reset-password/${token}`, data),
};

// Organization API
export const organizationAPI = {
  // Organization management
  getMyOrganization: () => api.get('/organizations/my-organization'),
  updateOrganization: (data: any) => api.put('/organizations/my-organization', data),

  // Member management
  getMembers: () => api.get('/organizations/members'),
  inviteMember: (data: { email: string; name?: string; role?: string }) =>
    api.post('/organizations/invite-member', data),
  removeMember: (userId: string) => api.delete(`/organizations/members/${userId}`),
  updateMemberRole: (userId: string, role: string) =>
    api.put(`/organizations/members/${userId}/role`, { role }),

  // Invitation management
  getInvitations: () => api.get('/organizations/invitations'),
  acceptInvitation: (token: string, data?: any) =>
    api.post(`/organizations/accept-invitation/${token}`, data),
  cancelInvitation: (invitationId: string) =>
    api.delete(`/organizations/invitations/${invitationId}`),

  // Workspace invite link
  generateInviteLink: (data?: { role?: 'member' | 'admin' }) => api.post('/organizations/generate-invite-link', data),
  getWorkspaceInfo: (token: string) => api.get(`/organizations/workspace-invite/${token}`),
  joinWorkspace: (token: string, data: { name: string; email: string; password: string }) =>
    api.post(`/organizations/join-workspace/${token}`, data),
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

// Advance Payment API
export const advancePaymentAPI = {
  create: (data: FormData) => api.post('/advance-payments', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getAll: (params?: any) => api.get('/advance-payments', { params }),
  getMyPayments: (params?: any) => api.get('/advance-payments/my-payments', { params }),
  getSummary: () => api.get('/advance-payments/summary'),
  update: (id: string, data: any) => api.put(`/advance-payments/${id}`, data),
  delete: (id: string) => api.delete(`/advance-payments/${id}`),
};

// Staff Salary API
export const staffSalaryAPI = {
  getTiers: () => api.get('/staff-salaries/tiers'),
  calculate: (data: { numberOfPersons: number }) => api.post('/staff-salaries/calculate', data),
  create: (data: FormData) => api.post('/staff-salaries', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getAll: (params?: any) => api.get('/staff-salaries', { params }),
  getSummary: (params?: any) => api.get('/staff-salaries/summary', { params }),
  getById: (id: string) => api.get(`/staff-salaries/${id}`),
  update: (id: string, data: any) => api.put(`/staff-salaries/${id}`, data),
  markAsPaid: (id: string, data?: { paymentMethod?: string }) => api.post(`/staff-salaries/${id}/mark-paid`, data),
  delete: (id: string) => api.delete(`/staff-salaries/${id}`),
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

// Account Deletion API
export const accountDeletionAPI = {
  requestDeletion: (data: { deletionReason?: string; deletionReasonText?: string }) =>
    api.post('/account/delete', data),
  recoverAccount: () => api.post('/account/recover'),
  getDeletionStatus: () => api.get('/account/deletion-status'),
  cancelDeletion: () => api.delete('/account/cancel-deletion'),
};

// Participation API
export const participationAPI = {
  getAll: () => api.get('/users/participation'),
  getMyParticipation: () => api.get('/users/participation/me'),
  updateParticipation: (userId: string, isParticipating: boolean) =>
    api.put(`/users/participation/${userId}`, { isParticipating }),
  getParticipatingUsers: () => api.get('/users/participation/active'),
};

export default api;
