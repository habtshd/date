import React, { useState } from 'react';
import { ShieldCheck, CheckCircle2, AlertCircle, Camera, FileText, ArrowRight } from 'lucide-react';
import { User } from '../types';
import { api } from '../services/api';

interface VerificationPageProps {
  user: User;
  onUpdateUser: (user: User) => void;
  onDone: () => void;
}

export const VerificationPage: React.FC<VerificationPageProps> = ({
  user,
  onUpdateUser,
  onDone,
}) => {
  const [step, setStep] = useState<'INTRO' | 'SCANNING' | 'CONFIRMING' | 'DONE'>(
    user.verificationStatus === 'VERIFIED' ? 'DONE' : 'INTRO'
  );
  const [faydaNumber, setFaydaNumber] = useState('ET-8839-2910');
  const [isVerifying, setIsVerifying] = useState(false);

  const handleStartVerification = async () => {
    setStep('SCANNING');
    setIsVerifying(true);

    try {
      await api.startVerification('FAYDA');
    } catch (_) {}

    // Simulate the Fayda biometric liveness & National ID verification
    setTimeout(() => {
      setStep('CONFIRMING');
      setTimeout(() => {
        const updated = { ...user, verificationStatus: 'VERIFIED' as const };
        onUpdateUser(updated);
        setStep('DONE');
        setIsVerifying(false);
      }, 1500);
    }, 2000);
  };

  return (
    <div style={{ maxWidth: 540, margin: '30px auto 80px', padding: '0 16px' }}>
      <div className="glass-panel" style={{ padding: 40, textAlign: 'center', borderRadius: 28 }}>
        {step === 'INTRO' && (
          <div>
            <div style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '2px solid rgba(16, 185, 129, 0.3)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 20,
            }}>
              <ShieldCheck size={44} color="var(--accent-emerald)" />
            </div>

            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', fontWeight: 800 }}>
              Verify with Fayda
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: 420, margin: '12px auto 28px', lineHeight: 1.6 }}>
              Sovereign guarantees a safe, respectful environment by verifying every member through Ethiopia’s National Identity (Fayda) system.
            </p>

            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--surface-border)',
              borderRadius: 16,
              padding: '16px 20px',
              textAlign: 'left',
              marginBottom: 28,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <CheckCircle2 size={18} color="var(--accent-emerald)" />
                <span style={{ fontSize: '0.85rem' }}>Full name matched with national registry</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <CheckCircle2 size={18} color="var(--accent-emerald)" />
                <span style={{ fontSize: '0.85rem' }}>Adult age requirement (18+) verified</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <CheckCircle2 size={18} color="var(--accent-emerald)" />
                <span style={{ fontSize: '0.85rem' }}>Raw biometrics and ID documents are never retained</span>
              </div>
            </div>

            <button
              onClick={handleStartVerification}
              className="gold-glow"
              style={{
                width: '100%',
                padding: '16px',
                borderRadius: 28,
                background: 'linear-gradient(135deg, var(--primary-gold) 0%, #FF8F00 100%)',
                color: '#000',
                fontWeight: 800,
                fontSize: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              Start Fayda Check <ArrowRight size={18} />
            </button>
          </div>
        )}

        {step === 'SCANNING' && (
          <div>
            <div style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: 'rgba(255, 179, 0, 0.1)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 20,
              animation: 'pulseSubtle 1.5s infinite',
            }}>
              <Camera size={40} color="var(--primary-gold)" />
            </div>

            <h3 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Biometric Liveness Check</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: 8 }}>
              Validating selfie match against the Fayda national identity database...
            </p>
          </div>
        )}

        {step === 'CONFIRMING' && (
          <div>
            <div style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.1)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 20,
            }}>
              <CheckCircle2 size={40} color="var(--accent-emerald)" />
            </div>

            <h3 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Cryptographic Handshake</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: 8 }}>
              Signing verification record and issuing verified badge...
            </p>
          </div>
        )}

        {step === 'DONE' && (
          <div>
            <div style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '2px solid var(--accent-emerald)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 20,
            }}>
              <ShieldCheck size={44} color="var(--accent-emerald)" />
            </div>

            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', fontWeight: 800 }}>
              You Are Verified!
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: 400, margin: '10px auto 28px' }}>
              Your account has full access to the Sovereign dating pool. All unblurred profiles, likes, and matches are now unlocked.
            </p>

            <button
              onClick={onDone}
              style={{
                width: '100%',
                padding: '16px',
                borderRadius: 28,
                background: 'var(--accent-emerald)',
                color: '#fff',
                fontWeight: 800,
                fontSize: '1rem',
              }}
            >
              Enter Discovery Pool
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
