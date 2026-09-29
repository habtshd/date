import React, { useState, useEffect } from 'react';
import { CreditCard, CheckCircle2, RotateCcw } from 'lucide-react';
import { PaymentLedgerItem } from '../types';
import { adminApi } from '../services/adminApi';

export const AdminPaymentsPage: React.FC = () => {
  const [payments, setPayments] = useState<PaymentLedgerItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    adminApi.getPayments()
      .then(setPayments)
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div style={{ padding: 32 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Telebirr & Chapa Transaction Ledger</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: 4 }}>
          Audit per-conversation payments, provider references, and escrow releases.
        </p>
      </div>

      <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
        <table>
          <thead>
            <tr>
              <th>Transaction ID</th>
              <th>Member Phone</th>
              <th>Amount</th>
              <th>Provider</th>
              <th>Provider Ref</th>
              <th>Status</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p.id}>
                <td>
                  <code style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{p.id}</code>
                </td>
                <td style={{ fontWeight: 600 }}>{p.userPhone}</td>
                <td style={{ color: 'var(--primary-gold)', fontWeight: 700 }}>
                  {p.amount} {p.currency}
                </td>
                <td>
                  <span className="badge badge-gold">{p.provider}</span>
                </td>
                <td>
                  <code style={{ fontSize: '0.75rem', color: 'var(--accent-blue)' }}>{p.providerReference}</code>
                </td>
                <td>
                  <span className="badge badge-emerald">{p.status}</span>
                </td>
                <td style={{ color: 'var(--text-dim)' }}>
                  {new Date(p.createdAt).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
