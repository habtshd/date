import React from 'react';
import { ShieldCheck, Heart, Lock, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  return (
    <div style={{ maxWidth: 1180, margin: '0 auto', padding: '24px 20px 80px' }}>
      {/* Hero Section */}
      <section style={{
        textAlign: 'center',
        padding: '60px 10px 80px',
        position: 'relative',
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 16px',
          borderRadius: 24,
          background: 'rgba(255, 179, 0, 0.1)',
          border: '1px solid rgba(255, 179, 0, 0.3)',
          color: 'var(--primary-gold)',
          fontSize: '0.85rem',
          fontWeight: 700,
          marginBottom: 24,
        }}>
          <ShieldCheck size={16} /> Ethiopia's 1st Identity-Verified Dating Ecosystem
        </div>

        <h1 style={{
          fontFamily: 'var(--font-serif)',
          fontSize: 'clamp(2.5rem, 6vw, 4.2rem)',
          fontWeight: 800,
          lineHeight: 1.15,
          letterSpacing: '-0.5px',
          marginBottom: 20,
          background: 'linear-gradient(180deg, #FFFFFF 30%, #CBD5E1 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          Authentic Dating, <br />
          <span style={{
            background: 'linear-gradient(135deg, var(--primary-gold) 0%, #FF8F00 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            Guaranteed by Fayda.
          </span>
        </h1>

        <p style={{
          maxWidth: 680,
          margin: '0 auto 36px',
          color: 'var(--text-secondary)',
          fontSize: 'clamp(1rem, 2vw, 1.2rem)',
          lineHeight: 1.6,
        }}>
          Eliminate romance scams, fake photos, and frivolous time-wasters. Every single member is verified through national biometric authority before entering discovery.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
          <button
            onClick={onGetStarted}
            className="gold-glow"
            style={{
              background: 'linear-gradient(135deg, var(--primary-gold) 0%, #FF8F00 100%)',
              color: '#000',
              fontWeight: 800,
              fontSize: '1.05rem',
              padding: '16px 36px',
              borderRadius: 36,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              transition: 'transform 0.2s ease',
            }}
          >
            Create Your Profile <ArrowRight size={20} />
          </button>
        </div>
      </section>

      {/* 3 Pillars Grid */}
      <section style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: 24,
        marginBottom: 80,
      }}>
        {/* Pillar 1 */}
        <div className="glass-panel" style={{ padding: 32 }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 14,
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 20,
          }}>
            <ShieldCheck size={26} color="var(--accent-emerald)" />
          </div>
          <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: 12 }}>
            Fayda National Verification
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6 }}>
            No bots or impersonators. Members verify identity via Ethiopian National ID and live biometric check. Unverified accounts cannot browse or message.
          </p>
        </div>

        {/* Pillar 2 */}
        <div className="glass-panel" style={{ padding: 32 }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 14,
            background: 'rgba(255, 51, 102, 0.12)',
            border: '1px solid rgba(255, 51, 102, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 20,
          }}>
            <Heart size={26} color="var(--accent-crimson)" />
          </div>
          <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: 12 }}>
            Serious & Honorable Intentions
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6 }}>
            Designed for genuine marriage, lifelong commitment, and respectful relationships honoring Ethiopian heritage, shared faith, and values.
          </p>
        </div>

        {/* Pillar 3 */}
        <div className="glass-panel" style={{ padding: 32 }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 14,
            background: 'rgba(255, 179, 0, 0.12)',
            border: '1px solid rgba(255, 179, 0, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 20,
          }}>
            <Lock size={26} color="var(--primary-gold)" />
          </div>
          <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: 12 }}>
            Protected Telebirr Conversations
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6 }}>
            Mutual matches require an intentional Telebirr unlock fee (150 ETB). This small friction guarantees genuine interest and eliminates spam.
          </p>
        </div>
      </section>

      {/* How it works flow */}
      <section className="glass-panel" style={{ padding: '48px 36px', marginBottom: 80 }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <span style={{ color: 'var(--primary-gold)', fontSize: '0.85rem', fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase' }}>
            The Sovereign Standard
          </span>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.2rem', marginTop: 8 }}>
            How Verification Protects You
          </h2>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 24,
        }}>
          {[
            { step: '01', title: 'Phone OTP', desc: 'Secure login via Ethiopian SMS verification.' },
            { step: '02', title: 'Profile Setup', desc: 'Add photos, relationship goals, and passions.' },
            { step: '03', title: 'Fayda ID Gate', desc: 'Instant biometric match against national register.' },
            { step: '04', title: 'Discover & Match', desc: 'Like verified profiles and unlock private chat.' },
          ].map((item, idx) => (
            <div key={idx} style={{
              padding: 24,
              borderRadius: 16,
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
            }}>
              <span style={{ color: 'var(--primary-gold)', fontSize: '1.8rem', fontWeight: 800, fontFamily: 'var(--font-serif)' }}>
                {item.step}
              </span>
              <h4 style={{ fontSize: '1.1rem', marginTop: 12, marginBottom: 8 }}>{item.title}</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.5 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
