import React, { useState, useEffect } from 'react';
import { ShieldCheck, Check, X, Eye, ExternalLink } from 'lucide-react';
import { VerificationQueueItem } from '../types';
import { adminApi } from '../services/adminApi';

export const AdminVerificationQueue: React.FC = () => {
  const [queue, setQueue] = useState<VerificationQueueItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    adminApi.getVerificationQueue()
      .then(setQueue)
      .finally(() => setIsLoading(false));
  }, []);

  const handleAction = (id: string, action: 'VERIFIED' | 'FAILED') => {
    setQueue((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: action } : item))
    );
  };

  return (
    <div style={{ padding: 32 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Fayda Verification Queue</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: 4 }}>
          Audit national ID verification records, biometric selfie comparisons, and grant entry into discovery.
        </p>
      </div>

      <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
        <table>
          <thead>
            <tr>
              <th>Member Name</th>
              <th>Phone Number</th>
              <th>Fayda Reference</th>
              <th>Submitted At</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {queue.map((item) => (
              <tr key={item.id}>
                <td style={{ fontWeight: 600 }}>{item.fullName}</td>
                <td style={{ color: 'var(--text-muted)' }}>{item.userPhone}</td>
                <td>
                  <code style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    padding: '3px 8px',
                    borderRadius: 6,
                    fontSize: '0.75rem',
                    color: 'var(--primary-gold)',
                  }}>
                    {item.providerReference || 'FAYDA-88392'}
                  </code>
                </td>
                <td style={{ color: 'var(--text-muted)' }}>
                  {new Date(item.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </td>
                <td>
                  <span className={`badge ${
                    item.status === 'VERIFIED'
                      ? 'badge-emerald'
                      : item.status === 'FAILED'
                      ? 'badge-coral'
                      : 'badge-gold'
                  }`}>
                    {item.status}
                  </span>
                </td>
                <td style={{ textAlign: 'right' }}>
                  {item.status === 'PENDING' ? (
                    <div style={{ display: 'inline-flex', gap: 8 }}>
                      <button
                        onClick={() => handleAction(item.id, 'VERIFIED')}
                        style={{
                          background: 'rgba(16, 185, 129, 0.15)',
                          color: 'var(--accent-emerald)',
                          padding: '6px 12px',
                          borderRadius: 8,
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <Check size={14} /> Approve
                      </button>
                      <button
                        onClick={() => handleAction(item.id, 'FAILED')}
                        style={{
                          background: 'rgba(255, 51, 102, 0.15)',
                          color: 'var(--accent-coral)',
                          padding: '6px 12px',
                          borderRadius: 8,
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <X size={14} /> Reject
                      </button>
                    </div>
                  ) : (
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Processed</span>
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
