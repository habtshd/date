import React from 'react';
import { User, ShieldCheck, Heart, MapPin } from 'lucide-react';
import { User as UserType } from '../types';

interface ProfilePageProps {
  user: UserType;
  onOpenVerification: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ user, onOpenVerification }) => {
  const profile = user.profile;

  return (
    <div style={{ maxWidth: 640, margin: '20px auto 80px', padding: '0 16px' }}>
      <div className="glass-panel" style={{ padding: 36, borderRadius: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 28 }}>
          <img
            src={profile?.photos[0]?.url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'}
            alt={profile?.firstName || 'User'}
            style={{
              width: 90,
              height: 90,
              borderRadius: '50%',
              objectFit: 'cover',
              border: '2px solid var(--primary-gold)',
            }}
          />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>
                {profile?.firstName || 'Abebe'}, {profile?.age || 26}
              </h2>
              {user.verificationStatus === 'VERIFIED' && (
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '4px 10px',
                  borderRadius: 14,
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  color: 'var(--accent-emerald)',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                }}>
                  <ShieldCheck size={14} /> FAYDA VERIFIED
                </span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: 4 }}>
              <MapPin size={14} /> {profile?.city || 'Addis Ababa'} • {user.phoneNumber}
            </div>
          </div>
        </div>

        {/* Bio */}
        <div style={{ marginBottom: 24 }}>
          <h4 style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 8, letterSpacing: 1 }}>
            About Me
          </h4>
          <p style={{ background: 'rgba(255, 255, 255, 0.03)', padding: 16, borderRadius: 16, border: '1px solid var(--surface-border)', fontSize: '0.9rem', lineHeight: 1.5 }}>
            {profile?.bio || 'Looking for an honorable partner who values Ethiopian cultural traditions and personal growth.'}
          </p>
        </div>

        {/* Relationship Goal */}
        <div style={{ marginBottom: 24 }}>
          <h4 style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 8, letterSpacing: 1 }}>
            Looking For
          </h4>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255, 179, 0, 0.1)', border: '1px solid rgba(255, 179, 0, 0.3)', padding: '8px 16px', borderRadius: 20, color: 'var(--primary-gold)', fontWeight: 600, fontSize: '0.85rem' }}>
            <Heart size={16} /> {profile?.relationshipGoal.replace('_', ' ') || 'MARRIAGE'}
          </div>
        </div>

        {/* Interests */}
        <div>
          <h4 style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 8, letterSpacing: 1 }}>
            Passions & Interests
          </h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {(profile?.interests || ['Coffee Ceremony', 'Traditional Music', 'Culinary & Cooking', 'Tech & Startups']).map((item, i) => (
              <span key={i} style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--surface-border)', padding: '6px 14px', borderRadius: 20, fontSize: '0.8rem' }}>
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
