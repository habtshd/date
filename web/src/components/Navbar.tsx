import React from 'react';
import { Heart, ShieldCheck, MessageCircle, User, LogOut } from 'lucide-react';
import { User as UserType } from '../types';

interface NavbarProps {
  user: UserType | null;
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onLogout: () => void;
  onOpenAuth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  currentTab,
  onSelectTab,
  onLogout,
  onOpenAuth,
}) => {
  return (
    <nav className="glass-panel" style={{
      margin: '16px 24px',
      padding: '14px 28px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 16,
      zIndex: 50,
    }}>
      {/* Brand */}
      <div 
        onClick={() => onSelectTab(user ? 'discover' : 'landing')}
        style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
      >
        <div style={{
          width: 38,
          height: 38,
          borderRadius: 12,
          background: 'linear-gradient(135deg, #FFB300 0%, #FF3366 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 15px rgba(255, 51, 102, 0.3)',
        }}>
          <Heart size={20} color="#fff" fill="#fff" />
        </div>
        <div>
          <span style={{ 
            fontFamily: 'var(--font-serif)', 
            fontSize: '1.25rem', 
            fontWeight: 800, 
            letterSpacing: '1px',
            color: '#fff' 
          }}>
            DATING
          </span>
          <span style={{ 
            fontSize: '0.65rem', 
            fontWeight: 700, 
            color: 'var(--primary-gold)',
            marginLeft: 6,
            letterSpacing: '1.5px',
          }}>
            VERIFIED
          </span>
        </div>
      </div>

      {/* Nav Links for Authenticated Users */}
      {user ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => onSelectTab('discover')}
            style={{
              padding: '8px 16px',
              borderRadius: 30,
              fontSize: '0.9rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: currentTab === 'discover' ? 'rgba(255, 179, 0, 0.15)' : 'transparent',
              color: currentTab === 'discover' ? 'var(--primary-gold)' : 'var(--text-secondary)',
              border: currentTab === 'discover' ? '1px solid rgba(255, 179, 0, 0.3)' : '1px solid transparent',
              transition: 'all 0.2s ease',
            }}
          >
            <Heart size={16} /> Discover
          </button>

          <button
            onClick={() => onSelectTab('matches')}
            style={{
              padding: '8px 16px',
              borderRadius: 30,
              fontSize: '0.9rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: currentTab === 'matches' ? 'rgba(255, 179, 0, 0.15)' : 'transparent',
              color: currentTab === 'matches' ? 'var(--primary-gold)' : 'var(--text-secondary)',
              border: currentTab === 'matches' ? '1px solid rgba(255, 179, 0, 0.3)' : '1px solid transparent',
              transition: 'all 0.2s ease',
            }}
          >
            <MessageCircle size={16} /> Matches & Chats
          </button>

          <button
            onClick={() => onSelectTab('verification')}
            style={{
              padding: '8px 16px',
              borderRadius: 30,
              fontSize: '0.9rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: user.verificationStatus === 'VERIFIED' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255, 179, 0, 0.12)',
              color: user.verificationStatus === 'VERIFIED' ? 'var(--accent-emerald)' : 'var(--primary-gold)',
              border: `1px solid ${user.verificationStatus === 'VERIFIED' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255, 179, 0, 0.3)'}`,
            }}
          >
            <ShieldCheck size={16} /> {user.verificationStatus === 'VERIFIED' ? 'Fayda Verified' : 'Verify ID'}
          </button>

          <button
            onClick={() => onSelectTab('profile')}
            style={{
              padding: '8px 14px',
              borderRadius: 30,
              color: currentTab === 'profile' ? 'var(--primary-gold)' : 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <User size={18} />
          </button>

          <button
            onClick={onLogout}
            title="Log Out"
            style={{
              padding: '8px 12px',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <LogOut size={18} />
          </button>
        </div>
      ) : (
        /* Public Links */
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button
            onClick={() => onSelectTab('landing')}
            style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 500 }}
          >
            How it works
          </button>
          <button
            onClick={onOpenAuth}
            style={{
              background: 'linear-gradient(135deg, var(--primary-gold) 0%, #ff8f00 100%)',
              color: '#000',
              fontWeight: 700,
              fontSize: '0.9rem',
              padding: '10px 22px',
              borderRadius: 30,
              boxShadow: '0 4px 15px rgba(255, 179, 0, 0.25)',
              transition: 'transform 0.2s ease',
            }}
          >
            Sign In / Register
          </button>
        </div>
      )}
    </nav>
  );
};
