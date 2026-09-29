import React, { useState, useEffect } from 'react';
import {
  Users,
  ShieldCheck,
  Heart,
  CreditCard,
  Clock,
  AlertTriangle,
  ArrowUpRight,
} from 'lucide-react';
import { DashboardMetrics } from '../types';
import { adminApi } from '../services/adminApi';

export const AdminDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    adminApi.getMetrics()
      .then(setMetrics)
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading || !metrics) {
    return <div style={{ padding: 32, color: 'var(--text-muted)' }}>Loading analytics...</div>;
  }

  const cards = [
    {
      title: 'Total Registered Members',
      value: metrics.totalUsers.toLocaleString(),
      change: '+14% this month',
      icon: Users,
      color: 'var(--accent-blue)',
    },
    {
      title: 'Fayda Verified Accounts',
      value: `${metrics.verifiedUsers.toLocaleString()} (${Math.round((metrics.verifiedUsers / metrics.totalUsers) * 100)}%)`,
      change: 'Identity Verified Rate',
      icon: ShieldCheck,
      color: 'var(--accent-emerald)',
    },
    {
      title: 'Active Matches Formed',
      value: metrics.activeMatches.toLocaleString(),
      change: 'Mutual Romantic Fits',
      icon: Heart,
      color: 'var(--accent-coral)',
    },
    {
      title: 'Gross Revenue (Telebirr)',
      value: `${metrics.totalRevenueEtb.toLocaleString()} ETB`,
      change: '150 ETB / unlocked chat',
      icon: CreditCard,
      color: 'var(--primary-gold)',
    },
  ];

  return (
    <div style={{ padding: 32 }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Platform Intelligence</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: 4 }}>
          Live metrics, national identity verification health, and monetization performance.
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: 20,
        marginBottom: 32,
      }}>
        {cards.map((c, i) => {
          const Icon = c.icon;
          return (
            <div key={i} className="admin-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  {c.title}
                </span>
                <div style={{
                  padding: 8,
                  borderRadius: 10,
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: c.color,
                }}>
                  <Icon size={18} />
                </div>
              </div>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 8 }}>{c.value}</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: c.color, fontWeight: 700 }}>
                <ArrowUpRight size={14} /> {c.change}
              </div>
            </div>
          );
        })}
      </div>

      {/* Action Queues Callouts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
        {/* Verification Queue Summary */}
        <div className="admin-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <Clock size={20} color="var(--primary-gold)" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Pending Fayda Verifications</h3>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 20 }}>
            {metrics.pendingVerifications} accounts currently awaiting manual biometric/identity review.
          </p>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary-gold)' }}>
            {metrics.pendingVerifications} Pending
          </div>
        </div>

        {/* Safety & Moderation Summary */}
        <div className="admin-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <AlertTriangle size={20} color="var(--accent-coral)" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Active Safety Reports</h3>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 20 }}>
            {metrics.openReports} unresolved member incident reports require investigation by moderators.
          </p>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent-coral)' }}>
            {metrics.openReports} Open
          </div>
        </div>
      </div>
    </div>
  );
};
