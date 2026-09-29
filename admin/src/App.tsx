import React, { useState } from 'react';
import { AdminSidebar } from './components/AdminSidebar';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminVerificationQueue } from './pages/AdminVerificationQueue';
import { AdminReportsModeration } from './pages/AdminReportsModeration';
import { AdminPaymentsPage } from './pages/AdminPaymentsPage';
import { AdminAuditLogsPage } from './pages/AdminAuditLogsPage';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { AdminUser } from './types';
import { adminApi } from './services/adminApi';

export function App() {
  const [admin, setAdmin] = useState<AdminUser | null>(() => {
    const token = adminApi.getToken();
    if (!token) return null;
    return {
      id: 'admin-01',
      email: 'admin@sovereigndate.et',
      role: 'ADMIN',
    };
  });

  const [currentTab, setCurrentTab] = useState<string>('dashboard');

  const handleLogout = () => {
    adminApi.setToken(null);
    setAdmin(null);
  };

  if (!admin) {
    return <AdminLoginPage onSuccess={(loggedInAdmin) => setAdmin(loggedInAdmin)} />;
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-admin)' }}>
      <AdminSidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        admin={admin}
        onLogout={handleLogout}
      />

      <main style={{ flex: 1, overflowY: 'auto' }}>
        {currentTab === 'dashboard' && <AdminDashboard />}
        {currentTab === 'verification' && <AdminVerificationQueue />}
        {currentTab === 'reports' && <AdminReportsModeration />}
        {currentTab === 'payments' && <AdminPaymentsPage />}
        {currentTab === 'audit-logs' && <AdminAuditLogsPage />}
      </main>
    </div>
  );
}
