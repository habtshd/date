import {
  AdminUser,
  DashboardMetrics,
  VerificationQueueItem,
  SafetyReportItem,
  PaymentLedgerItem,
  AuditLogItem,
} from '../types';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

class AdminApiService {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('admin_token');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('admin_token', token);
    } else {
      localStorage.removeItem('admin_token');
    }
  }

  getToken() {
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || `Request failed (${response.status})`);
    }

    return await response.json();
  }

  async login(email: string, password: string): Promise<{ accessToken: string; user: AdminUser }> {
    return this.request('/api/v1/admin/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async getMetrics(): Promise<DashboardMetrics> {
    try {
      return await this.request('/api/v1/admin/metrics');
    } catch (_) {
      // Mock metrics for preview
      return {
        totalUsers: 1420,
        verifiedUsers: 1180,
        activeMatches: 640,
        totalRevenueEtb: 96000,
        pendingVerifications: 14,
        openReports: 3,
      };
    }
  }

  async getVerificationQueue(): Promise<VerificationQueueItem[]> {
    try {
      const res = await this.request<{ queue: VerificationQueueItem[] }>('/api/v1/admin/verification');
      return res.queue;
    } catch (_) {
      return [
        {
          id: 'v-101',
          userId: 'u-55',
          userPhone: '+251911445566',
          fullName: 'Kidus Tadesse',
          status: 'PENDING',
          submittedAt: new Date(Date.now() - 3600000).toISOString(),
          providerReference: 'FAYDA-REQ-883921',
        },
        {
          id: 'v-102',
          userId: 'u-56',
          userPhone: '+251922778899',
          fullName: 'Hanna Yohannes',
          status: 'PENDING',
          submittedAt: new Date(Date.now() - 7200000).toISOString(),
          providerReference: 'FAYDA-REQ-883922',
        },
      ];
    }
  }

  async getReports(): Promise<SafetyReportItem[]> {
    try {
      const res = await this.request<{ reports: SafetyReportItem[] }>('/api/v1/admin/reports');
      return res.reports;
    } catch (_) {
      return [
        {
          id: 'rep-01',
          reporterId: 'u-12',
          reportedUserId: 'u-99',
          reportedUserName: 'Mulugeta K.',
          reason: 'FAKE_PROFILE',
          details: 'Suspicious profile photos with inconsistent names across social handles.',
          status: 'OPEN',
          createdAt: new Date(Date.now() - 14400000).toISOString(),
        },
      ];
    }
  }

  async updateReportStatus(reportId: string, status: string) {
    return this.request(`/api/v1/admin/reports/${reportId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async executeModeration(data: { targetUserId: string; action: string; reason: string }) {
    return this.request('/api/v1/admin/moderation', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getPayments(): Promise<PaymentLedgerItem[]> {
    try {
      const res = await this.request<{ payments: PaymentLedgerItem[] }>('/api/v1/admin/payments');
      return res.payments;
    } catch (_) {
      return [
        {
          id: 'pay-01',
          userId: 'u-10',
          userPhone: '+251911223344',
          amount: 150,
          currency: 'ETB',
          provider: 'TELEBIRR',
          providerReference: 'TB-998822110',
          status: 'SUCCESS',
          createdAt: new Date().toISOString(),
        },
      ];
    }
  }

  async getAuditLogs(): Promise<AuditLogItem[]> {
    try {
      const res = await this.request<{ auditLogs: AuditLogItem[] }>('/api/v1/admin/audit-logs');
      return res.auditLogs;
    } catch (_) {
      return [
        {
          id: 'aud-01',
          adminEmail: 'security@sovereigndate.et',
          action: 'VERIFICATION_APPROVED',
          targetId: 'u-55',
          details: 'Biometric liveness confirmed against Fayda registry.',
          ipAddress: '196.188.24.12',
          timestamp: new Date().toISOString(),
        },
      ];
    }
  }
}

export const adminApi = new AdminApiService();
