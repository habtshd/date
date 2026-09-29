import React, { useState, useEffect } from 'react';
import { MessageCircle, Lock, ShieldCheck, Heart, ArrowRight } from 'lucide-react';
import { MatchItem } from '../types';
import { api } from '../services/api';

interface MatchesPageProps {
  onSelectConversation: (conversationId: string) => void;
}

export const MatchesPage: React.FC<MatchesPageProps> = ({ onSelectConversation }) => {
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadMatches();
  }, []);

  const loadMatches = async () => {
    setIsLoading(true);
    try {
      const res = await api.getMatches();
      setMatches(res.matches || []);
    } catch (_) {
      // Fallback mock matches for preview
      setMatches([
        {
          id: 'm-1',
          matchedUserId: 'usr-2',
          firstName: 'Bethlehem',
          age: 25,
          city: 'Addis Ababa',
          photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
          matchedAt: new Date().toISOString(),
          conversationId: 'conv-mock-123',
          isConversationActive: false, // Locked until Telebirr unlock
        },
        {
          id: 'm-2',
          matchedUserId: 'usr-4',
          firstName: 'Eden',
          age: 24,
          city: 'Addis Ababa',
          photoUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
          matchedAt: new Date(Date.now() - 86400000).toISOString(),
          conversationId: 'conv-mock-456',
          isConversationActive: true, // Unlocked
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 840, margin: '20px auto 60px', padding: '0 16px' }}>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', fontWeight: 800 }}>
          Mutual Matches
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: 4 }}>
          Profiles where you both indicated mutual romantic interest.
        </p>
      </div>

      {isLoading ? (
        <p style={{ color: 'var(--text-secondary)' }}>Loading matches...</p>
      ) : matches.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '60px 24px', borderRadius: 24 }}>
          <Heart size={48} color="var(--accent-crimson)" style={{ marginBottom: 12 }} />
          <h3>No mutual matches yet</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: 6 }}>
            Keep discovering profiles to find someone who shares your values.
          </p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: 20,
        }}>
          {matches.map((match) => (
            <div
              key={match.id}
              className="glass-panel"
              style={{
                borderRadius: 20,
                overflow: 'hidden',
                transition: 'transform 0.2s ease, border-color 0.2s ease',
                cursor: 'pointer',
              }}
              onClick={() => onSelectConversation(match.conversationId)}
            >
              <div style={{ position: 'relative', height: 260 }}>
                <img
                  src={match.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'}
                  alt={match.firstName}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(180deg, transparent 50%, rgba(9, 10, 15, 0.9) 100%)',
                }} />

                <div style={{ position: 'absolute', bottom: 12, left: 16, right: 16 }}>
                  <h4 style={{ fontSize: '1.25rem', fontWeight: 800 }}>
                    {match.firstName}, {match.age}
                  </h4>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {match.city}
                  </span>
                </div>
              </div>

              <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {match.isConversationActive ? (
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      color: 'var(--accent-emerald)',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                    }}>
                      <MessageCircle size={14} /> ACTIVE CHAT
                    </span>
                  ) : (
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      color: 'var(--primary-gold)',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                    }}>
                      <Lock size={14} /> LOCKED (150 ETB)
                    </span>
                  )}
                </div>

                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: match.isConversationActive ? 'var(--accent-emerald)' : 'var(--primary-gold)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#000',
                }}>
                  <ArrowRight size={16} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
