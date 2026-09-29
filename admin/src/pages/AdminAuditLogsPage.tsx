import React, { useState, useEffect } from 'react';
import { History, Shield, Lock } from 'lucide-react';
import { AuditLogItem } from '../types';
import { adminApi } from '../services/adminApi';

export const AdminAuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    adminApi.getAuditLogs()
      .then(setLogs)
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div style={{ padding: 32 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Immutable Security Audit Log</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: 4 }}>
          Tamper-evident record of all administrative verifications, bans, refunds, and access events.
        </p>
      </div>

      <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
        <table>
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Staff Operator</th>
              <th>Action</th>
              <th>Target Entity</th>
              <th>Operational Details</th>
              <th>IP Address</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id}>
                <td style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>
                  {new Date(log.timestamp).toLocaleString()}
                </td>
                <td style={{ fontWeight: 600 }}>{log.adminEmail}</td>
                <td>
                  <span className="badge badge-gold">{log.action}</span>
                </td>
                <td>
                  <code style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{log.targetId || 'N/A'}</code>
                </td>
                <td style={{ color: 'var(--text-muted)', maxWidth: 280 }}>{log.details || '-'}</td>
                <td>
                  <code style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)' }}>{log.ipAddress || '127.0.0.1'}</code>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
