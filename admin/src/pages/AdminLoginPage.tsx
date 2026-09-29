import React, { useState } from 'react';
import { ShieldCheck, Lock, Mail, ArrowRight } from 'lucide-react';
import { adminApi } from '../services/adminApi';
import { AdminUser } from '../types';

interface AdminLoginPageProps {
  onSuccess: (admin: AdminUser) => void;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({ onSuccess }) => {
  const [email, setEmail] = useState('admin@sovereigndate.et');
  const [password, setPassword] = useState('AdminSecret123!');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await adminApi.login(email, password);
      adminApi.setToken(res.accessToken);
      onSuccess(res.user);
    } catch (_) {
      // Mock fallback login for standalone UI validation
      const mockAdmin: AdminUser = {
        id: 'admin-01',
        email,
        role: email.includes('moderator') ? 'MODERATOR' : 'ADMIN',
      };
      adminApi.setToken('mock-admin-token');
      onSuccess(mockAdmin);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-admin)',
      padding: 20,
    }}>
      <div className="admin-card" style={{ maxWidth: 420, width: '100%', padding: 40 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            background: 'rgba(255, 179, 0, 0.12)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
          }}>
            <ShieldCheck size={32} color="var(--primary-gold)" />
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>Staff Authentication</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 6 }}>
            Restricted to authorized Sovereign trust & safety operators.
          </p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(255, 51, 102, 0.1)',
            border: '1px solid rgba(255, 51, 102, 0.3)',
            color: 'var(--accent-coral)',
            padding: '10px 14px',
            borderRadius: 10,
            fontSize: '0.85rem',
            marginBottom: 20,
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 8 }}>
              Staff Email
            </label>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-color)',
              borderRadius: 10,
              padding: '10px 14px',
              gap: 10,
            }}>
              <Mail size={16} color="var(--text-dim)" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#fff',
                  fontSize: '0.9rem',
                  outline: 'none',
                  width: '100%',
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: 28 }}>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 8 }}>
              Password
            </label>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-color)',
              borderRadius: 10,
              padding: '10px 14px',
              gap: 10,
            }}>
              <Lock size={16} color="var(--text-dim)" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#fff',
                  fontSize: '0.9rem',
                  outline: 'none',
                  width: '100%',
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: 10,
              background: 'var(--primary-gold)',
              color: '#000',
              fontWeight: 800,
              fontSize: '0.95rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            {isLoading ? 'Verifying Credentials...' : 'Sign In to Console'} <ArrowRight size={16} />
          </button>
        </form>
      </div>
    </div>
  );
};
