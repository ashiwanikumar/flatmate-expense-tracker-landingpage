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

// OTP API
export const otpAPI = {
  sendOTP: (data: { email: string }) => api.post('/otp/send', data),
  verifyOTP: (data: { email: string; otp: string }) => api.post('/otp/verify', data),
  checkSession: (email: string) => api.get('/otp/session', { params: { email } }),
};

// CMDB Infrastructure API
export const cmdbInfrastructureAPI = {
  getAll: (params?: any) => api.get('/cmdb-infrastructure', { params }),
  getOne: (id: string, includeSecrets?: boolean) =>
    api.get(`/cmdb-infrastructure/${id}`, { params: { includeSecrets } }),
  create: (data: any) => api.post('/cmdb-infrastructure', data),
  update: (id: string, data: any) => api.put(`/cmdb-infrastructure/${id}`, data),
  delete: (id: string) => api.delete(`/cmdb-infrastructure/${id}`),
  getByCategory: () => api.get('/cmdb-infrastructure/by-category'),
  getStatistics: () => api.get('/cmdb-infrastructure/statistics'),
};

// Architecture Diagram API
export const architectureAPI = {
  getAll: () => api.get('/architecture'),
  getOne: (id: string) => api.get(`/architecture/${id}`),
  create: (data: any) => api.post('/architecture', data),
  update: (id: string, data: any) => api.put(`/architecture/${id}`, data),
  delete: (id: string) => api.delete(`/architecture/${id}`),
};

// Cloudron API
export const cloudronAPI = {
  // Server management
  testConnection: (data: { serverUrl: string; apiToken: string }) =>
    api.post('/cloudron/test-connection', data),
  addServer: (data: any) => api.post('/cloudron/servers', data),
  getServers: () => api.get('/cloudron/servers'),
  getServer: (id: string) => api.get(`/cloudron/servers/${id}`),
  updateServer: (id: string, data: any) => api.put(`/cloudron/servers/${id}`, data),
  deleteServer: (id: string) => api.delete(`/cloudron/servers/${id}`),
  syncServer: (id: string) => api.post(`/cloudron/servers/${id}/sync`),
  getServerStats: (id: string) => api.get(`/cloudron/servers/${id}/stats`),

  // Apps management
  getApps: (serverId: string) => api.get(`/cloudron/servers/${serverId}/apps`),
  getApp: (serverId: string, appId: string) =>
    api.get(`/cloudron/servers/${serverId}/apps/${appId}`),

  // Mailboxes management
  getMailboxes: (serverId: string) => api.get(`/cloudron/servers/${serverId}/mailboxes`),
  createMailbox: (serverId: string, data: any) =>
    api.post(`/cloudron/servers/${serverId}/mailboxes`, data),
  updateMailbox: (serverId: string, mailboxId: string, data: any) =>
    api.put(`/cloudron/servers/${serverId}/mailboxes/${mailboxId}`, data),
  deleteMailbox: (serverId: string, mailboxId: string, domain: string) =>
    api.delete(`/cloudron/servers/${serverId}/mailboxes/${mailboxId}?domain=${encodeURIComponent(domain)}`),

  // Domains management
  getDomains: (serverId: string) => api.get(`/cloudron/servers/${serverId}/domains`),
  addDomain: (serverId: string, data: any) =>
    api.post(`/cloudron/servers/${serverId}/domains`, data),
  getDomain: (serverId: string, domain: string) =>
    api.get(`/cloudron/servers/${serverId}/domains/${domain}`),
  deleteDomain: (serverId: string, domain: string) =>
    api.delete(`/cloudron/servers/${serverId}/domains/${domain}`),
  setDomainConfig: (serverId: string, domain: string, data: any) =>
    api.post(`/cloudron/servers/${serverId}/domains/${domain}/config`, data),
  setWellKnown: (serverId: string, domain: string, data: any) =>
    api.post(`/cloudron/servers/${serverId}/domains/${domain}/wellknown`, data),
  checkDnsRecords: (serverId: string, domain: string, subdomain: string) =>
    api.get(`/cloudron/servers/${serverId}/domains/${domain}/dns-check?subdomain=${encodeURIComponent(subdomain)}`),
  syncDns: (serverId: string, data: any) =>
    api.post(`/cloudron/servers/${serverId}/domains/sync-dns`, data),
  getMailConfig: (serverId: string, domain: string) =>
    api.get(`/cloudron/servers/${serverId}/domains/${domain}/mail-config`),

  // Mail domain management
  getMailDomain: (serverId: string, domain: string) =>
    api.get(`/cloudron/servers/${serverId}/mail/${domain}`),
  enableMailDomain: (serverId: string, domain: string, enabled: boolean) =>
    api.post(`/cloudron/servers/${serverId}/mail/${domain}/enable`, { enabled }),
  getMailDomainStatus: (serverId: string, domain: string) =>
    api.get(`/cloudron/servers/${serverId}/mail/${domain}/status`),
  setMailFromValidation: (serverId: string, domain: string, enabled: boolean) =>
    api.post(`/cloudron/servers/${serverId}/mail/${domain}/mail-from-validation`, { enabled }),
  setCatchAllAddresses: (serverId: string, domain: string, addresses: string[]) =>
    api.post(`/cloudron/servers/${serverId}/mail/${domain}/catch-all`, { addresses }),
  setMailRelay: (serverId: string, domain: string, relayConfig: any) =>
    api.post(`/cloudron/servers/${serverId}/mail/${domain}/relay`, relayConfig),
  setMailSignature: (serverId: string, domain: string, signatureData: any) =>
    api.post(`/cloudron/servers/${serverId}/mail/${domain}/banner`, signatureData),
  sendTestMail: (serverId: string, domain: string, to: string) =>
    api.post(`/cloudron/servers/${serverId}/mail/${domain}/send-test-mail`, { to }),
  getMailboxCount: (serverId: string, domain: string) =>
    api.get(`/cloudron/servers/${serverId}/mail/${domain}/mailbox-count`),

  // Mailboxes for specific domain
  getMailboxesForDomain: (serverId: string, domain: string) =>
    api.get(`/cloudron/servers/${serverId}/mail/${domain}/mailboxes`),
  addMailboxToDomain: (serverId: string, domain: string, data: any) =>
    api.post(`/cloudron/servers/${serverId}/mail/${domain}/mailboxes`, data),
  getMailboxFromDomain: (serverId: string, domain: string, name: string) =>
    api.get(`/cloudron/servers/${serverId}/mail/${domain}/mailboxes/${name}`),
  updateMailboxInDomain: (serverId: string, domain: string, name: string, data: any) =>
    api.post(`/cloudron/servers/${serverId}/mail/${domain}/mailboxes/${name}`, data),
  deleteMailboxFromDomain: (serverId: string, domain: string, name: string, deleteMails: boolean = false) =>
    api.delete(`/cloudron/servers/${serverId}/mail/${domain}/mailboxes/${name}`, {
      data: { deleteMails }
    }),

  // Mailbox aliases
  getMailboxAliases: (serverId: string, domain: string, name: string) =>
    api.get(`/cloudron/servers/${serverId}/mail/${domain}/mailboxes/${name}/aliases`),
  setMailboxAliases: (serverId: string, domain: string, name: string, aliases: any[]) =>
    api.post(`/cloudron/servers/${serverId}/mail/${domain}/mailboxes/${name}/aliases`, { aliases }),

  // Mail lists management
  getMailLists: (serverId: string, domain: string, params?: any) =>
    api.get(`/cloudron/servers/${serverId}/mail/${domain}/lists`, { params }),
  addMailList: (serverId: string, domain: string, data: any) =>
    api.post(`/cloudron/servers/${serverId}/mail/${domain}/lists`, data),
  getMailList: (serverId: string, domain: string, name: string) =>
    api.get(`/cloudron/servers/${serverId}/mail/${domain}/lists/${name}`),
  updateMailList: (serverId: string, domain: string, name: string, data: any) =>
    api.post(`/cloudron/servers/${serverId}/mail/${domain}/lists/${name}`, data),
  deleteMailList: (serverId: string, domain: string, name: string) =>
    api.delete(`/cloudron/servers/${serverId}/mail/${domain}/lists/${name}`),

  // Mailserver configuration
  getMailserverEventlogs: (serverId: string, params?: any) =>
    api.get(`/cloudron/servers/${serverId}/mailserver/eventlog`, { params }),
  clearMailserverEventlogs: (serverId: string, till?: number) =>
    api.post(`/cloudron/servers/${serverId}/mailserver/clear_eventlog`, null, { params: { till } }),
  getMailserverLocation: (serverId: string) =>
    api.get(`/cloudron/servers/${serverId}/mailserver/location`),
  setMailserverLocation: (serverId: string, data: { domain: string; subdomain: string }) =>
    api.post(`/cloudron/servers/${serverId}/mailserver/location`, data),
  getMaxEmailSize: (serverId: string) =>
    api.get(`/cloudron/servers/${serverId}/mailserver/max_email_size`),
  setMaxEmailSize: (serverId: string, size: number) =>
    api.post(`/cloudron/servers/${serverId}/mailserver/max_email_size`, { size }),
  getSpamAcl: (serverId: string) =>
    api.get(`/cloudron/servers/${serverId}/mailserver/spam_acl`),
  setSpamAcl: (serverId: string, blacklist: string[]) =>
    api.post(`/cloudron/servers/${serverId}/mailserver/spam_acl`, { blacklist }),
  getSpamCustomConfig: (serverId: string) =>
    api.get(`/cloudron/servers/${serverId}/mailserver/spam_custom_config`),
  setSpamCustomConfig: (serverId: string, config: string) =>
    api.post(`/cloudron/servers/${serverId}/mailserver/spam_custom_config`, { config }),
  getDnsblConfig: (serverId: string) =>
    api.get(`/cloudron/servers/${serverId}/mailserver/dnsbl_config`),
  setDnsblConfig: (serverId: string, zones: string[]) =>
    api.post(`/cloudron/servers/${serverId}/mailserver/dnsbl_config`, { zones }),
  getSolrConfig: (serverId: string) =>
    api.get(`/cloudron/servers/${serverId}/mailserver/solr_config`),
  setSolrConfig: (serverId: string, enabled: boolean) =>
    api.post(`/cloudron/servers/${serverId}/mailserver/solr_config`, { enabled }),
  getMailboxSharing: (serverId: string) =>
    api.get(`/cloudron/servers/${serverId}/mailserver/mailbox_sharing`),
  setMailboxSharing: (serverId: string, enabled: boolean) =>
    api.post(`/cloudron/servers/${serverId}/mailserver/mailbox_sharing`, { enabled }),
  getVirtualAllMail: (serverId: string) =>
    api.get(`/cloudron/servers/${serverId}/mailserver/virtual_all_mail`),
  setVirtualAllMail: (serverId: string, enabled: boolean) =>
    api.post(`/cloudron/servers/${serverId}/mailserver/virtual_all_mail`, { enabled }),
  getMailserverUsage: (serverId: string) =>
    api.get(`/cloudron/servers/${serverId}/mailserver/usage`),

  // Network management
  getBlocklist: (serverId: string) =>
    api.get(`/cloudron/servers/${serverId}/network/blocklist`),
  setBlocklist: (serverId: string, blocklist: string) =>
    api.post(`/cloudron/servers/${serverId}/network/blocklist`, { blocklist }),
  getDynamicDns: (serverId: string) =>
    api.get(`/cloudron/servers/${serverId}/network/dynamic-dns`),
  setDynamicDns: (serverId: string, enabled: boolean) =>
    api.post(`/cloudron/servers/${serverId}/network/dynamic-dns`, { enabled }),
  getIpv4Config: (serverId: string) =>
    api.get(`/cloudron/servers/${serverId}/network/ipv4-config`),
  setIpv4Config: (serverId: string, data: { provider: string; ip?: string }) =>
    api.post(`/cloudron/servers/${serverId}/network/ipv4-config`, data),
  getIpv6Config: (serverId: string) =>
    api.get(`/cloudron/servers/${serverId}/network/ipv6-config`),
  setIpv6Config: (serverId: string, data: { provider: string; ip?: string }) =>
    api.post(`/cloudron/servers/${serverId}/network/ipv6-config`, data),
  getIpv4Address: (serverId: string) =>
    api.get(`/cloudron/servers/${serverId}/network/ipv4`),
  getIpv6Address: (serverId: string) =>
    api.get(`/cloudron/servers/${serverId}/network/ipv6`),

  // Notification management
  getNotifications: (serverId: string, params?: any) =>
    api.get(`/cloudron/servers/${serverId}/notifications`, { params }),
  getNotification: (serverId: string, notificationId: string) =>
    api.get(`/cloudron/servers/${serverId}/notifications/${notificationId}`),
  updateNotification: (serverId: string, notificationId: string, data: { acknowledged: boolean }) =>
    api.post(`/cloudron/servers/${serverId}/notifications/${notificationId}`, data),

  // Profile management
  getProfile: (serverId: string) =>
    api.get(`/cloudron/servers/${serverId}/profile`),
  updateProfile: (serverId: string, data: { email?: string; fallbackEmail?: string; password?: string; displayName?: string }) =>
    api.post(`/cloudron/servers/${serverId}/profile`, data),
  updateAvatar: (serverId: string, file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return api.post(`/cloudron/servers/${serverId}/profile/avatar`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },
  getAvatar: (serverId: string, userId: string) =>
    api.get(`/cloudron/servers/${serverId}/profile/avatar/${userId}`, {
      responseType: 'blob'
    }),
  getBackgroundImage: (serverId: string) =>
    api.get(`/cloudron/servers/${serverId}/profile/background_image`, {
      responseType: 'blob'
    }),
  setBackgroundImage: (serverId: string, file: File) => {
    const formData = new FormData();
    formData.append('backgroundImage', file);
    return api.post(`/cloudron/servers/${serverId}/profile/background_image`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },
  updatePassword: (serverId: string, data: { password: string; newPassword: string }) =>
    api.post(`/cloudron/servers/${serverId}/profile/password`, data),
  set2FASecret: (serverId: string) =>
    api.post(`/cloudron/servers/${serverId}/profile/twofactorauthentication_secret`),
  enable2FA: (serverId: string, totpToken: string) =>
    api.post(`/cloudron/servers/${serverId}/profile/twofactorauthentication_enable`, { totpToken }),
  disable2FA: (serverId: string, password: string) =>
    api.post(`/cloudron/servers/${serverId}/profile/twofactorauthentication_disable`, { password }),

  // Provision management
  configureInitialDomain: (serverId: string, data: { domainConfig: any; ipv4Config?: any; ipv6Config?: any }) =>
    api.post(`/cloudron/servers/${serverId}/provision`, data),
  provisionSetup: (serverId: string, data: { domainConfig: any; ipv4Config?: any; ipv6Config?: any }) =>
    api.post(`/cloudron/servers/${serverId}/provision/setup`, data),
  provisionRestore: (serverId: string, data: {
    backupConfig: any;
    encryptedFilenames?: boolean;
    remotePath: string;
    version?: string;
    ipv4Config?: any;
    ipv6Config?: any;
    skipDnsSetup?: boolean
  }) =>
    api.post(`/cloudron/servers/${serverId}/provision/restore`, data),
  provisionCreateAdmin: (serverId: string, data: {
    username: string;
    password: string;
    email: string;
    displayName?: string
  }) =>
    api.post(`/cloudron/servers/${serverId}/provision/create-admin`, data),

  // Reverse proxy management
  renewCerts: (serverId: string, rebuild?: boolean) =>
    api.post(`/cloudron/servers/${serverId}/reverseproxy/renew-certs`, { rebuild: rebuild || false }),
  getTrustedIps: (serverId: string) =>
    api.get(`/cloudron/servers/${serverId}/reverseproxy/trusted-ips`),
  setTrustedIps: (serverId: string, trustedIps: string) =>
    api.post(`/cloudron/servers/${serverId}/reverseproxy/trusted-ips`, { trustedIps }),

  // Services management
  listServices: (serverId: string) =>
    api.get(`/cloudron/servers/${serverId}/services`),
  getPlatformStatus: (serverId: string) =>
    api.get(`/cloudron/servers/${serverId}/services/platform_status`),
  getService: (serverId: string, serviceName: string) =>
    api.get(`/cloudron/servers/${serverId}/services/${serviceName}`),
  configureService: (serverId: string, serviceName: string, config: { memoryLimit: number; recoveryMode: boolean }) =>
    api.post(`/cloudron/servers/${serverId}/services/${serviceName}`, config),
  getServiceGraphs: (serverId: string, serviceName: string, fromMinutes: number) =>
    api.get(`/cloudron/servers/${serverId}/services/${serviceName}/graphs`, { params: { fromMinutes } }),
  getServiceLogs: (serverId: string, serviceName: string, lines: number, format?: string) =>
    api.get(`/cloudron/servers/${serverId}/services/${serviceName}/logs`, { params: { lines, format: format || 'json' } }),
  getServiceLogstream: (serverId: string, serviceName: string, lines: number, format?: string) =>
    api.get(`/cloudron/servers/${serverId}/services/${serviceName}/logstream`, { params: { lines, format: format || 'json' } }),
  restartService: (serverId: string, serviceName: string) =>
    api.post(`/cloudron/servers/${serverId}/services/${serviceName}/restart`),
  rebuildService: (serverId: string, serviceName: string) =>
    api.post(`/cloudron/servers/${serverId}/services/${serviceName}/rebuild`),

  // System information
  getSystemInfo: (serverId: string) =>
    api.get(`/cloudron/servers/${serverId}/system/info`),
  rebootSystem: (serverId: string) =>
    api.post(`/cloudron/servers/${serverId}/system/reboot`),
  getSystemCpus: (serverId: string) =>
    api.get(`/cloudron/servers/${serverId}/system/cpus`),
  getSystemDiskUsage: (serverId: string) =>
    api.get(`/cloudron/servers/${serverId}/system/disk-usage`),
  updateSystemDiskUsage: (serverId: string) =>
    api.post(`/cloudron/servers/${serverId}/system/disk-usage`),
  getSystemBlockDevices: (serverId: string) =>
    api.get(`/cloudron/servers/${serverId}/system/block-devices`),
  getSystemMemory: (serverId: string) =>
    api.get(`/cloudron/servers/${serverId}/system/memory`),
  getSystemLogs: (serverId: string, unit: string, lines?: number, format?: string) =>
    api.get(`/cloudron/servers/${serverId}/system/logs/${unit}`, { params: { lines: lines || 100, format: format || 'json' } }),
  getSystemLogStreamUrl: (serverId: string, unit: string, lines?: number, format?: string) =>
    api.get(`/cloudron/servers/${serverId}/system/logstream/${unit}`, { params: { lines: lines || 100, format: format || 'json' } }),

  // Tasks management
  getTasks: (serverId: string, params?: { page?: number; per_page?: number; type?: string }) =>
    api.get(`/cloudron/servers/${serverId}/tasks`, { params }),
  getTask: (serverId: string, taskId: string) =>
    api.get(`/cloudron/servers/${serverId}/tasks/${taskId}`),
  getTaskLogs: (serverId: string, taskId: string, params?: { lines?: number; format?: string }) =>
    api.get(`/cloudron/servers/${serverId}/tasks/${taskId}/logs`, { params }),
  getTaskLogStreamUrl: (serverId: string, taskId: string, lines?: number) =>
    api.get(`/cloudron/servers/${serverId}/tasks/${taskId}/logstream`, { params: { lines } }),
  stopTask: (serverId: string, taskId: string) =>
    api.post(`/cloudron/servers/${serverId}/tasks/${taskId}/stop`),

  // Volumes management
  addVolume: (serverId: string, data: { name: string; mountType: string; mountOptions: any }) =>
    api.post(`/cloudron/servers/${serverId}/volumes`, data),
  listVolumes: (serverId: string) =>
    api.get(`/cloudron/servers/${serverId}/volumes`),
  getVolume: (serverId: string, volumeId: string) =>
    api.get(`/cloudron/servers/${serverId}/volumes/${volumeId}`),
  updateVolume: (serverId: string, volumeId: string, data: { mountOptions: any }) =>
    api.post(`/cloudron/servers/${serverId}/volumes/${volumeId}`, data),
  deleteVolume: (serverId: string, volumeId: string) =>
    api.delete(`/cloudron/servers/${serverId}/volumes/${volumeId}`),
  getVolumeStatus: (serverId: string, volumeId: string) =>
    api.get(`/cloudron/servers/${serverId}/volumes/${volumeId}/status`),
  remountVolume: (serverId: string, volumeId: string) =>
    api.post(`/cloudron/servers/${serverId}/volumes/${volumeId}/remount`),
  getFileFromVolume: (serverId: string, volumeId: string, filename: string) =>
    api.get(`/cloudron/servers/${serverId}/volumes/${volumeId}/files/${filename}`, {
      responseType: 'blob'
    }),

  // User directory management
  getUserDirectoryProfileConfig: (serverId: string) =>
    api.get(`/cloudron/servers/${serverId}/user-directory/profile-config`),
  setUserDirectoryProfileConfig: (serverId: string, data: { lockUserProfiles: boolean; mandatory2FA: boolean }) =>
    api.post(`/cloudron/servers/${serverId}/user-directory/profile-config`, data),

  // Updater management
  getPendingUpdates: (serverId: string) =>
    api.get(`/cloudron/servers/${serverId}/updater/updates`),
  checkForUpdates: (serverId: string) =>
    api.post(`/cloudron/servers/${serverId}/updater/check`),
  updateCloudron: (serverId: string, skipBackup?: boolean) =>
    api.post(`/cloudron/servers/${serverId}/updater/update`, { skipBackup }),
  getUpdateSchedule: (serverId: string) =>
    api.get(`/cloudron/servers/${serverId}/updater/schedule`),
  setUpdateSchedule: (serverId: string, pattern: string) =>
    api.post(`/cloudron/servers/${serverId}/updater/schedule`, { pattern }),

  // Users management
  listUsers: (serverId: string, params?: { page?: number; per_page?: number; search?: string; active?: boolean }) =>
    api.get(`/cloudron/servers/${serverId}/users`, { params }),

  // Branding management
  getCloudronAvatar: (serverId: string) =>
    api.get(`/cloudron/servers/${serverId}/branding/cloudron_avatar`, {
      responseType: 'blob'
    }),
  setCloudronAvatar: (serverId: string, file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return api.post(`/cloudron/servers/${serverId}/branding/cloudron_avatar`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  getCloudronName: (serverId: string) =>
    api.get(`/cloudron/servers/${serverId}/branding/cloudron_name`),
  setCloudronName: (serverId: string, name: string) =>
    api.post(`/cloudron/servers/${serverId}/branding/cloudron_name`, { name }),
  getCloudronBackground: (serverId: string) =>
    api.get(`/cloudron/servers/${serverId}/branding/cloudron_background`, {
      responseType: 'blob'
    }),
  setCloudronBackground: (serverId: string, file: File | null) => {
    const formData = new FormData();
    if (file) {
      formData.append('background', file);
    }
    return api.post(`/cloudron/servers/${serverId}/branding/cloudron_background`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  getCloudronFooter: (serverId: string) =>
    api.get(`/cloudron/servers/${serverId}/branding/footer`),
  setCloudronFooter: (serverId: string, footer: string) =>
    api.post(`/cloudron/servers/${serverId}/branding/footer`, { footer }),

  // Cloudron status
  getCloudronStatus: (serverId: string) =>
    api.get(`/cloudron/servers/${serverId}/cloudron/status`),

  // Eventlog management
  getEventlogs: (serverId: string, params?: any) =>
    api.get(`/cloudron/servers/${serverId}/eventlogs`, { params }),
  getEventlog: (serverId: string, eventId: string) =>
    api.get(`/cloudron/servers/${serverId}/eventlogs/${eventId}`),
};

export default api;
