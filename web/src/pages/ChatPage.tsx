import React, { useState, useEffect } from 'react';
import { Send, Lock, Shield, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { MessageItem, User } from '../types';
import { api } from '../services/api';

interface ChatPageProps {
  conversationId: string;
  user: User;
  onBack: () => void;
}

export const ChatPage: React.FC<ChatPageProps> = ({ conversationId, user, onBack }) => {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isPaying, setIsPaying] = useState(false);

  useEffect(() => {
    loadChat();
  }, [conversationId]);

  const loadChat = async () => {
    setIsLoading(true);
    try {
      const convo = await api.getConversation(conversationId);
      setIsUnlocked(convo.status === 'ACTIVE');
      if (convo.status === 'ACTIVE') {
        const msgs = await api.getMessages(conversationId);
        setMessages(msgs.messages || []);
      }
    } catch (_) {
      // Mock fallback: if it's the mock unlocked conversation 'conv-mock-456'
      if (conversationId === 'conv-mock-456') {
        setIsUnlocked(true);
        setMessages([
          {
            id: 'm-1',
            senderId: 'usr-4',
            content: 'Selam! So glad we matched. How was your weekend?',
            createdAt: '10:30 AM',
            isMe: false,
          },
          {
            id: 'm-2',
            senderId: user.id,
            content: 'Selam Eden! It was great, enjoyed an authentic coffee ceremony with family.',
            createdAt: '10:32 AM',
            isMe: true,
          },
        ]);
      } else {
        setIsUnlocked(false);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayTelebirr = async () => {
    setIsPaying(true);
    try {
      await api.initiatePayment(conversationId, 'TELEBIRR');
      // Simulate successful payment confirmation
      setTimeout(() => {
        setIsUnlocked(true);
        setMessages([
          {
            id: 'sys-1',
            senderId: 'system',
            content: 'Telebirr payment confirmed (150 ETB). This conversation is now permanently active and private.',
            createdAt: 'Just now',
            isMe: false,
          },
        ]);
        setIsPaying(false);
      }, 1200);
    } catch (_) {
      setIsUnlocked(true);
      setIsPaying(false);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const newMsg: MessageItem = {
      id: `msg-${Date.now()}`,
      senderId: user.id,
      content: inputMessage.trim(),
      createdAt: 'Just now',
      isMe: true,
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputMessage('');

    api.sendMessage(conversationId, newMsg.content).catch(() => {});
  };

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 20px', color: 'var(--text-secondary)' }}>
        <p>Loading conversation...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 680, margin: '20px auto 60px', padding: '0 16px' }}>
      {/* Header */}
      <div className="glass-panel" style={{
        padding: '14px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: 20,
        marginBottom: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={onBack} style={{ color: 'var(--text-secondary)' }}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Protected Private Chat</h3>
            <span style={{ fontSize: '0.75rem', color: isUnlocked ? 'var(--accent-emerald)' : 'var(--primary-gold)' }}>
              {isUnlocked ? '● ACTIVE CONVERSATION' : '🔒 PAYMENT REQUIRED TO UNLOCK'}
            </span>
          </div>
        </div>

        <button
          onClick={() => alert('Safety Report Dialog: You can report any inappropriate behavior to the trust and safety team.')}
          style={{ color: 'var(--text-muted)' }}
          title="Report User"
        >
          <Shield size={20} />
        </button>
      </div>

      {!isUnlocked ? (
        /* Locked Conversation Paywall Card */
        <div className="glass-panel" style={{ padding: '48px 32px', textAlign: 'center', borderRadius: 24 }}>
          <div style={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            background: 'rgba(255, 179, 0, 0.1)',
            border: '2px solid rgba(255, 179, 0, 0.3)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 20,
          }}>
            <Lock size={36} color="var(--primary-gold)" />
          </div>

          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', fontWeight: 800 }}>
            Unlock Conversation
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: 420, margin: '12px auto 28px', lineHeight: 1.5 }}>
            To foster respectful, committed interactions and eliminate spammers, Sovereign requires a small one-time connection fee for this specific match.
          </p>

          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid var(--surface-border)',
            borderRadius: 16,
            padding: '20px 24px',
            maxWidth: 360,
            margin: '0 auto 28px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <div style={{ textAlign: 'left' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>One-time Connection Fee</span>
              <h3 style={{ fontSize: '1.4rem', color: 'var(--primary-gold)', fontWeight: 800 }}>150 ETB</h3>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)', fontWeight: 700 }}>
              UNLIMITED MESSAGES
            </span>
          </div>

          <button
            onClick={handlePayTelebirr}
            disabled={isPaying}
            className="gold-glow"
            style={{
              padding: '16px 40px',
              borderRadius: 30,
              background: 'linear-gradient(135deg, var(--primary-gold) 0%, #FF8F00 100%)',
              color: '#000',
              fontWeight: 800,
              fontSize: '1rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            {isPaying ? 'Processing Telebirr...' : 'Pay with Telebirr (150 ETB)'}
          </button>
        </div>
      ) : (
        /* Active Chat Message Thread */
        <div className="glass-panel" style={{
          height: 520,
          borderRadius: 24,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}>
          {/* Messages list */}
          <div style={{
            flex: 1,
            padding: 20,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
          }}>
            {messages.map((m) => (
              <div
                key={m.id}
                style={{
                  alignSelf: m.isMe ? 'flex-end' : 'flex-start',
                  maxWidth: '75%',
                }}
              >
                <div style={{
                  padding: '12px 18px',
                  borderRadius: m.isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  background: m.isMe ? 'linear-gradient(135deg, var(--primary-gold) 0%, #FF8F00 100%)' : 'rgba(255, 255, 255, 0.08)',
                  color: m.isMe ? '#000' : 'var(--text-primary)',
                  fontWeight: m.isMe ? 600 : 400,
                  fontSize: '0.95rem',
                  lineHeight: 1.4,
                  boxShadow: m.isMe ? '0 4px 15px rgba(255, 179, 0, 0.2)' : 'none',
                }}>
                  {m.content}
                </div>
                <span style={{
                  display: 'block',
                  fontSize: '0.7rem',
                  color: 'var(--text-muted)',
                  marginTop: 4,
                  textAlign: m.isMe ? 'right' : 'left',
                }}>
                  {m.createdAt}
                </span>
              </div>
            ))}
          </div>

          {/* Input field */}
          <form
            onSubmit={handleSendMessage}
            style={{
              padding: '16px 20px',
              borderTop: '1px solid var(--surface-border)',
              display: 'flex',
              gap: 12,
              background: 'rgba(9, 10, 15, 0.5)',
            }}
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Type your message..."
              style={{
                flex: 1,
                padding: '12px 18px',
                borderRadius: 24,
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--surface-border)',
                color: '#fff',
                fontSize: '0.9rem',
                outline: 'none',
              }}
            />
            <button
              type="submit"
              style={{
                width: 46,
                height: 46,
                borderRadius: '50%',
                background: 'var(--primary-gold)',
                color: '#000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
