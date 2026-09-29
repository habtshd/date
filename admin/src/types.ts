export interface AdminUser {
  id: string;
  email: string;
  role: 'ADMIN' | 'MODERATOR';
}

export interface DashboardMetrics {
  totalUsers: number;
  verifiedUsers: number;
  activeMatches: number;
  totalRevenueEtb: number;
  pendingVerifications: number;
  openReports: number;
}

export interface VerificationQueueItem {
  id: string;
  userId: string;
  userPhone: string;
  fullName: string;
  status: 'PENDING' | 'VERIFIED' | 'FAILED';
  submittedAt: string;
  providerReference?: string;
}

export interface SafetyReportItem {
  id: string;
  reporterId: string;
  reportedUserId: string;
  reportedUserName: string;
  reason: string;
  details?: string;
  status: 'OPEN' | 'INVESTIGATING' | 'ACTIONED' | 'DISMISSED';
  createdAt: string;
}

export interface PaymentLedgerItem {
  id: string;
  userId: string;
  userPhone: string;
  amount: number;
  currency: string;
  provider: string;
  providerReference: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';
  createdAt: string;
}

export interface AuditLogItem {
  id: string;
  adminEmail: string;
  action: string;
  targetId?: string;
  details?: string;
  ipAddress?: string;
  timestamp: string;
}
