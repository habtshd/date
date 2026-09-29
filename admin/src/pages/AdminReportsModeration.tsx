import React, { useState, useEffect } from 'react';
import { AlertTriangle, ShieldAlert, CheckCircle, Ban, UserX } from 'lucide-react';
import { SafetyReportItem } from '../types';
import { adminApi } from '../services/adminApi';

export const AdminReportsModeration: React.FC = () => {
  const [reports, setReports] = useState<SafetyReportItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    adminApi.getReports()
      .then(setReports)
      .finally(() => setIsLoading(false));
  }, []);

  const handleModeration = async (reportId: string, reportedUserId: string, action: 'WARN' | 'SUSPEND' | 'BAN' | 'DISMISS') => {
    try {
      if (action !== 'DISMISS') {
        await adminApi.executeModeration({
          targetUserId: reportedUserId,
          action,
          reason: 'Violated Sovereign Community Standards',
        });
      }
      setReports((prev) =>
        prev.map((r) => (r.id === reportId ? { ...r, status: action === 'DISMISS' ? 'DISMISSED' : 'ACTIONED' } : r))
      );
    } catch (_) {
      setReports((prev) =>
        prev.map((r) => (r.id === reportId ? { ...r, status: action === 'DISMISS' ? 'DISMISSED' : 'ACTIONED' } : r))
      );
    }
  };

  return (
    <div style={{ padding: 32 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Safety & Moderation Dispatch</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: 4 }}>
          Investigate reported accounts, review violation details, and enforce disciplinary bans.
        </p>
      </div>

      <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
        <table>
          <thead>
            <tr>
              <th>Reported User</th>
              <th>Violation Reason</th>
              <th>Evidence / Details</th>
              <th>Reported At</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Enforcement</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((report) => (
              <tr key={report.id}>
                <td style={{ fontWeight: 600 }}>{report.reportedUserName}</td>
                <td>
                  <span className="badge badge-coral">{report.reason}</span>
                </td>
                <td style={{ maxWidth: 300, color: 'var(--text-muted)' }}>
                  {report.details || 'No additional details provided.'}
                </td>
                <td style={{ color: 'var(--text-dim)' }}>
                  {new Date(report.createdAt).toLocaleDateString()}
                </td>
                <td>
                  <span className={`badge ${
                    report.status === 'ACTIONED'
                      ? 'badge-emerald'
                      : report.status === 'DISMISSED'
                      ? 'badge-dim'
                      : 'badge-gold'
                  }`}>
                    {report.status}
                  </span>
                </td>
                <td style={{ textAlign: 'right' }}>
                  {report.status === 'OPEN' ? (
                    <div style={{ display: 'inline-flex', gap: 6 }}>
                      <button
                        onClick={() => handleModeration(report.id, report.reportedUserId, 'SUSPEND')}
                        style={{
                          background: 'rgba(255, 179, 0, 0.15)',
                          color: 'var(--primary-gold)',
                          padding: '6px 10px',
                          borderRadius: 6,
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <UserX size={13} /> Suspend
                      </button>
                      <button
                        onClick={() => handleModeration(report.id, report.reportedUserId, 'BAN')}
                        style={{
                          background: 'rgba(255, 51, 102, 0.15)',
                          color: 'var(--accent-coral)',
                          padding: '6px 10px',
                          borderRadius: 6,
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <Ban size={13} /> Ban
                      </button>
                    </div>
                  ) : (
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Resolved</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
