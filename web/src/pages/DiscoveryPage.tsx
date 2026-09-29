import React, { useState, useEffect } from 'react';
import { Heart, X, ShieldCheck, MapPin, Sparkles, MessageCircle, Lock } from 'lucide-react';
import { DiscoveryProfile, User } from '../types';
import { api } from '../services/api';

interface DiscoveryPageProps {
  user: User;
  onOpenVerification: () => void;
  onOpenChat: (conversationId: string) => void;
}

export const DiscoveryPage: React.FC<DiscoveryPageProps> = ({
  user,
  onOpenVerification,
  onOpenChat,
}) => {
  const [profiles, setProfiles] = useState<DiscoveryProfile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [matchedProfile, setMatchedProfile] = useState<{ profile: DiscoveryProfile; conversationId?: string } | null>(null);

  useEffect(() => {
    loadFeed();
  }, [user.verificationStatus]);

  const loadFeed = async () => {
    setIsLoading(true);
    try {
      if (user.verificationStatus === 'VERIFIED') {
        const res = await api.getDiscoveryFeed();
        setProfiles(res.profiles || []);
      } else {
        const res = await api.getPreviewFeed();
        setProfiles(res.profiles || []);
      }
    } catch (_) {
      // Fallback mock profiles for web demonstration
      setProfiles([
        {
          userId: 'usr-2',
          firstName: 'Bethlehem',
          age: 25,
          city: 'Addis Ababa',
          relationshipGoal: 'MARRIAGE',
          bio: 'Passionate about architectural heritage, coffee culture, and Sunday hikes in Entoto.',
          interests: ['Coffee Ceremony', 'Traditional Music', 'Architecture', 'Hiking'],
          photos: [
            {
              id: 'ph-1',
              url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
              isPrimary: true,
            },
          ],
          isVerified: true,
        },
        {
          userId: 'usr-3',
          firstName: 'Dawit',
          age: 28,
          city: 'Addis Ababa',
          relationshipGoal: 'SERIOUS_RELATIONSHIP',
          bio: 'Software engineer building fintech solutions for East Africa. Enjoys Ethiopian literature and running.',
          interests: ['Tech & Startups', 'Running / Athletics', 'Ethiopian Literature'],
          photos: [
            {
              id: 'ph-2',
              url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80',
              isPrimary: true,
            },
          ],
          isVerified: true,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLike = async () => {
    if (currentIndex >= profiles.length) return;
    const current = profiles[currentIndex];

    try {
      const res = await api.likeUser(current.userId);
      if (res.matched) {
        setMatchedProfile({ profile: current, conversationId: res.conversationId });
      }
    } catch (_) {
      // For preview, simulate a match on Bethlehem
      if (current.firstName === 'Bethlehem') {
        setMatchedProfile({ profile: current, conversationId: 'conv-mock-123' });
      }
    }
    setCurrentIndex((prev) => prev + 1);
  };

  const handlePass = async () => {
    if (currentIndex >= profiles.length) return;
    const current = profiles[currentIndex];
    try {
      await api.passUser(current.userId);
    } catch (_) {}
    setCurrentIndex((prev) => prev + 1);
  };

  const isVerified = user.verificationStatus === 'VERIFIED';
  const currentProfile = profiles[currentIndex];

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 20px', color: 'var(--text-secondary)' }}>
        <Sparkles size={36} color="var(--primary-gold)" style={{ animation: 'pulseSubtle 1.5s infinite' }} />
        <p style={{ marginTop: 16 }}>Discovering compatible verified members...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 520, margin: '20px auto 60px', padding: '0 16px' }}>
      {/* Unverified Mode Notice Banner */}
      {!isVerified && (
        <div style={{
          background: 'rgba(255, 179, 0, 0.1)',
          border: '1px solid rgba(255, 179, 0, 0.3)',
          borderRadius: 16,
          padding: '12px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 20,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Lock size={18} color="var(--primary-gold)" />
            <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600 }}>
              Preview Mode (Interactions Locked)
            </span>
          </div>
          <button
            onClick={onOpenVerification}
            style={{
              background: 'var(--primary-gold)',
              color: '#000',
              fontWeight: 700,
              fontSize: '0.75rem',
              padding: '6px 14px',
              borderRadius: 20,
            }}
          >
            Verify with Fayda
          </button>
        </div>
      )}

      {/* Profile Card Deck */}
      {currentProfile ? (
        <div className="glass-panel" style={{
          borderRadius: 28,
          overflow: 'hidden',
          position: 'relative',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
        }}>
          {/* Photo & Overlays */}
          <div style={{ position: 'relative', height: 480, width: '100%', overflow: 'hidden' }}>
            <img
              src={currentProfile.photos[0]?.url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80'}
              alt={currentProfile.firstName}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                filter: isVerified ? 'none' : 'blur(16px)',
                transform: isVerified ? 'none' : 'scale(1.1)',
              }}
            />

            {/* Gradient */}
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(180deg, transparent 40%, rgba(9, 10, 15, 0.95) 100%)',
            }} />

            {/* Verified Badge */}
            <div style={{
              position: 'absolute',
              top: 18,
              left: 18,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'rgba(9, 10, 15, 0.7)',
              backdropFilter: 'blur(8px)',
              padding: '6px 12px',
              borderRadius: 20,
              border: '1px solid rgba(16, 185, 129, 0.4)',
              color: 'var(--accent-emerald)',
              fontSize: '0.75rem',
              fontWeight: 800,
            }}>
              <ShieldCheck size={14} /> FAYDA VERIFIED
            </div>

            {/* Profile Info Overlay */}
            <div style={{ position: 'absolute', bottom: 20, left: 24, right: 24 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                <h2 style={{ fontSize: '2rem', fontWeight: 800 }}>{currentProfile.firstName}</h2>
                <span style={{ fontSize: '1.5rem', color: 'var(--text-secondary)' }}>{currentProfile.age}</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--primary-gold)', fontSize: '0.9rem', marginTop: 4 }}>
                <MapPin size={15} /> {currentProfile.city} • {currentProfile.relationshipGoal.replace('_', ' ')}
              </div>
            </div>
          </div>

          {/* Bio & Interests */}
          <div style={{ padding: '20px 24px' }}>
            {currentProfile.bio && (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: 16 }}>
                "{currentProfile.bio}"
              </p>
            )}

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
              {currentProfile.interests.map((interest, i) => (
                <span
                  key={i}
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--surface-border)',
                    padding: '5px 12px',
                    borderRadius: 20,
                    fontSize: '0.8rem',
                    color: 'var(--text-primary)',
                  }}
                >
                  {interest}
                </span>
              ))}
            </div>

            {/* Swiping Buttons */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 24 }}>
              <button
                onClick={handlePass}
                disabled={!isVerified}
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-muted)',
                  cursor: isVerified ? 'pointer' : 'not-allowed',
                }}
              >
                <X size={32} />
              </button>

              <button
                onClick={handleLike}
                disabled={!isVerified}
                className="crimson-glow"
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--accent-crimson) 0%, #E11D48 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  cursor: isVerified ? 'pointer' : 'not-allowed',
                }}
              >
                <Heart size={30} fill="#fff" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '60px 24px', borderRadius: 28 }}>
          <Sparkles size={48} color="var(--primary-gold)" style={{ marginBottom: 16 }} />
          <h3 style={{ fontSize: '1.5rem', fontWeight: 800 }}>You're all caught up!</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: 8, maxWidth: 360, margin: '8px auto 24px' }}>
            You've reviewed all compatible candidates matching your criteria. Check back soon!
          </p>
          <button
            onClick={loadFeed}
            style={{
              border: '1px solid var(--primary-gold)',
              color: 'var(--primary-gold)',
              padding: '10px 24px',
              borderRadius: 24,
              fontWeight: 600,
            }}
          >
            Refresh Feed
          </button>
        </div>
      )}

      {/* Mutual Match Modal */}
      {matchedProfile && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: 20,
        }}>
          <div className="glass-panel" style={{
            maxWidth: 400,
            width: '100%',
            padding: 36,
            textAlign: 'center',
            borderRadius: 28,
            border: '1px solid rgba(255, 51, 102, 0.4)',
          }}>
            <div style={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--accent-crimson) 0%, #FFB300 100%)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
            }}>
              <Heart size={36} color="#fff" fill="#fff" />
            </div>

            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.2rem', fontWeight: 800 }}>
              It's a Match!
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: 8 }}>
              You and {matchedProfile.profile.firstName} liked each other!
            </p>

            <button
              onClick={() => {
                const convId = matchedProfile.conversationId || 'conv-mock-123';
                setMatchedProfile(null);
                onOpenChat(convId);
              }}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: 24,
                background: 'linear-gradient(135deg, var(--primary-gold) 0%, #FF8F00 100%)',
                color: '#000',
                fontWeight: 700,
                fontSize: '1rem',
                marginTop: 24,
                marginBottom: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <MessageCircle size={18} /> Open Protected Chat
            </button>

            <button
              onClick={() => setMatchedProfile(null)}
              style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}
            >
              Keep Browsing
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
