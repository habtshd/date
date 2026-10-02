import React from 'react';
import { Shield, Lock, Award, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer style={{
      borderTop: '1px solid var(--surface-border)',
      background: 'rgba(9, 10, 15, 0.95)',
      padding: '48px 24px 24px',
      marginTop: 'auto',
    }}>
      <div style={{
        maxWidth: 1100,
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: 32,
        marginBottom: 36,
      }}>
        {/* Brand statement */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Heart size={20} color="var(--primary-gold)" fill="var(--primary-gold)" />
            <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', fontWeight: 800 }}>
              DATING
            </span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.6 }}>
            Ethiopia's trusted dating sanctuary. Built on verified national identity, mutual consent, and cultural dignity.
          </p>
        </div>

        {/* Security Pillars */}
        <div>
          <h4 style={{ fontSize: '0.9rem', color: 'var(--primary-gold)', marginBottom: 14, textTransform: 'uppercase', letterSpacing: 1 }}>
            Trust & Security
          </h4>
          <ul style={{ listStyle: 'none', color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 2 }}>
            <li style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Shield size={14} color="var(--accent-emerald)" /> Fayda National ID Verification
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Lock size={14} color="var(--accent-emerald)" /> Zero Raw Biometrics Retention
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Award size={14} color="var(--accent-emerald)" /> Telebirr & Chapa Escrow Protection
            </li>
          </ul>
        </div>

        {/* Policies */}
        <div>
          <h4 style={{ fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: 14 }}>
            Community & Legal
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            <a href="#safety">Community Guidelines</a>
            <a href="#privacy">Privacy Manifesto</a>
            <a href="#terms">Terms of Service</a>
            <a href="#contact">Contact Support</a>
          </div>
        </div>
      </div>

      <div style={{
        maxWidth: 1100,
        margin: '0 auto',
        paddingTop: 20,
        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 12,
        color: 'var(--text-muted)',
        fontSize: '0.75rem',
      }}>
        <span>© {new Date().getFullYear()} Dating Inc. All rights reserved. Addis Ababa, Ethiopia.</span>
        <span>Made with dignity for the Ethiopian Diaspora & Homeland</span>
      </div>
    </footer>
  );
};
