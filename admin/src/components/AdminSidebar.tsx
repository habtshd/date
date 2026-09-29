import React from 'react';
import {
  LayoutDashboard,
  ShieldCheck,
  AlertTriangle,
  CreditCard,
  History,
  LogOut,
  Heart,
} from 'lucide-react';
import { AdminUser } from '../types';

interface AdminSidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  admin: AdminUser | null;
  onLogout: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  currentTab,
  onSelectTab,
  admin,
  onLogout,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard, role: 'MODERATOR' },
    { id: 'verification', label: 'Fayda Queue', icon: ShieldCheck, role: 'MODERATOR' },
    { id: 'reports', label: 'Safety & Reports', icon: AlertTriangle, role: 'MODERATOR' },
    { id: 'payments', label: 'Payments Ledger', icon: CreditCard, role: 'ADMIN' },
    { id: 'audit-logs', label: 'Security Audit Logs', icon: History, role: 'ADMIN' },
  ];

  return (
    <aside style={{
      width: 260,
      backgroundColor: 'var(--sidebar-bg)',
      borderRight: '1px solid var(--border-color)',
      padding: '24px 16px',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      position: 'sticky',
      top: 0,
    }}>
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 8px 24px', borderBottom: '1px solid var(--border-color)' }}>
        <div style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: 'linear-gradient(135deg, var(--primary-gold) 0%, var(--accent-coral) 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Heart size={20} color="#fff" fill="#fff" />
        </div>
        <div>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#fff' }}>SOVEREIGN</h3>
          <span style={{ fontSize: '0.7rem', color: 'var(--primary-gold)', fontWeight: 700 }}>COMMAND CENTER</span>
        </div>
      </div>

      {/* Nav List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, margin: '20px 0', flex: 1 }}>
        {navItems.map((item) => {
          // If current admin is MODERATOR, hide ADMIN-only tabs
          if (item.role === 'ADMIN' && admin?.role !== 'ADMIN') {
            return null;
          }

          const isActive = currentTab === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 14px',
                borderRadius: 12,
                fontSize: '0.85rem',
                fontWeight: isActive ? 700 : 500,
                color: isActive ? 'var(--primary-gold)' : 'var(--text-muted)',
                background: isActive ? 'rgba(255, 179, 0, 0.1)' : 'transparent',
                border: isActive ? '1px solid rgba(255, 179, 0, 0.25)' : '1px solid transparent',
                textAlign: 'left',
                transition: 'all 0.15s ease',
              }}
            >
              <Icon size={18} />
              {item.label}
            </button>
          );
        })}
      </div>

      {/* Admin Profile & Logout */}
      <div style={{
        paddingTop: 16,
        borderTop: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div>
          <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)' }}>
            {admin?.email || 'admin@sovereigndate.et'}
          </p>
          <span style={{ fontSize: '0.7rem', color: 'var(--accent-emerald)', fontWeight: 700 }}>
            {admin?.role || 'ADMIN'}
          </span>
        </div>
        <button
          onClick={onLogout}
          title="Sign Out"
          style={{ color: 'var(--text-dim)', padding: 8 }}
        >
          <LogOut size={18} />
        </button>
      </div>
    </aside>
  );
};
