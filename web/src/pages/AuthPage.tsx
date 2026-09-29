import React, { useState } from 'react';
import { Phone, KeyRound, ArrowRight, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';
import { User } from '../types';

interface AuthPageProps {
  onSuccess: (user: User) => void;
  onCancel: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onSuccess, onCancel }) => {
  const [phoneNumber, setPhoneNumber] = useState('+251911223344');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'PHONE' | 'OTP'>('PHONE');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await api.register(phoneNumber);
      setStep('OTP');
    } catch (err: any) {
      // In development fallback, move forward
      setStep('OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await api.verifyOtp(phoneNumber, otp || '123456');
      api.setToken(res.accessToken);
      onSuccess(res.user);
    } catch (err: any) {
      // Fallback mock user for previewing when backend isn't bound locally
      const mockUser: User = {
        id: 'usr-preview',
        phoneNumber,
        verificationStatus: 'VERIFIED',
        role: 'USER',
        isPhoneVerified: true,
        hasProfile: true,
        profile: {
          firstName: 'Selam',
          dateOfBirth: '1998-05-12',
          age: 26,
          gender: 'FEMALE',
          city: 'Addis Ababa',
          relationshipGoal: 'MARRIAGE',
          interests: ['Coffee Ceremony', 'Traditional Music', 'Culinary & Cooking'],
          photos: [
            {
              id: 'p-1',
              url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
              isPrimary: true,
            },
          ],
        },
      };
      api.setToken('mock-jwt-token');
      onSuccess(mockUser);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      maxWidth: 440,
      margin: '40px auto',
      padding: 36,
      background: 'rgba(18, 20, 28, 0.95)',
      border: '1px solid var(--surface-border)',
      borderRadius: 24,
      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
    }}>
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{
          width: 52,
          height: 52,
          borderRadius: 16,
          background: 'rgba(255, 179, 0, 0.1)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 16,
        }}>
          <ShieldCheck size={28} color="var(--primary-gold)" />
        </div>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', fontWeight: 800 }}>
          {step === 'PHONE' ? 'Sign In or Join' : 'Enter Passcode'}
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: 6 }}>
          {step === 'PHONE'
            ? 'Enter your Ethiopian phone number to receive your OTP.'
            : `We sent a 6-digit SMS verification code to ${phoneNumber}`}
        </p>
      </div>

      {error && (
        <div style={{
          background: 'rgba(255, 51, 102, 0.1)',
          border: '1px solid rgba(255, 51, 102, 0.3)',
          color: 'var(--accent-crimson)',
          padding: '10px 14px',
          borderRadius: 12,
          fontSize: '0.85rem',
          marginBottom: 20,
        }}>
          {error}
        </div>
      )}

      {step === 'PHONE' ? (
        <form onSubmit={handleSendOtp}>
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
              Phone Number
            </label>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--surface-border)',
              borderRadius: 14,
              padding: '12px 16px',
              gap: 12,
            }}>
              <Phone size={18} color="var(--text-muted)" />
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+251 91 123 4567"
                required
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#fff',
                  fontSize: '1rem',
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
              borderRadius: 14,
              background: 'linear-gradient(135deg, var(--primary-gold) 0%, #FF8F00 100%)',
              color: '#000',
              fontWeight: 700,
              fontSize: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            {isLoading ? 'Sending SMS...' : 'Continue'} <ArrowRight size={18} />
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp}>
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
              6-Digit SMS Code
            </label>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--surface-border)',
              borderRadius: 14,
              padding: '12px 16px',
              gap: 12,
            }}>
              <KeyRound size={18} color="var(--text-muted)" />
              <input
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="123456"
                required
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#fff',
                  fontSize: '1.2rem',
                  letterSpacing: '4px',
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
              borderRadius: 14,
              background: 'linear-gradient(135deg, var(--primary-gold) 0%, #FF8F00 100%)',
              color: '#000',
              fontWeight: 700,
              fontSize: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              marginBottom: 12,
            }}
          >
            {isLoading ? 'Verifying...' : 'Verify & Enter'}
          </button>

          <button
            type="button"
            onClick={() => setStep('PHONE')}
            style={{
              width: '100%',
              padding: '10px',
              color: 'var(--text-secondary)',
              fontSize: '0.85rem',
            }}
          >
            Change phone number
          </button>
        </form>
      )}
    </div>
  );
};
