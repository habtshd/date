import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { LandingPage } from './pages/LandingPage';
import { AuthPage } from './pages/AuthPage';
import { DiscoveryPage } from './pages/DiscoveryPage';
import { MatchesPage } from './pages/MatchesPage';
import { ChatPage } from './pages/ChatPage';
import { VerificationPage } from './pages/VerificationPage';
import { ProfilePage } from './pages/ProfilePage';
import { User } from './types';
import { api } from './services/api';

export function App() {
  const [user, setUser] = useState<User | null>(null);
  const [currentTab, setCurrentTab] = useState<string>('landing');
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  useEffect(() => {
    // Check if token exists
    if (api.getToken()) {
      api.getMe()
        .then((res) => {
          setUser(res.user);
          setCurrentTab('discover');
        })
        .catch(() => {
          // Token expired or invalid
          api.setToken(null);
        });
    }
  }, []);

  const handleLoginSuccess = (authenticatedUser: User) => {
    setUser(authenticatedUser);
    setIsAuthOpen(false);
    setCurrentTab('discover');
  };

  const handleLogout = () => {
    api.setToken(null);
    setUser(null);
    setCurrentTab('landing');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar
        user={user}
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setCurrentTab(tab);
          setActiveConversationId(null);
        }}
        onLogout={handleLogout}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      <main style={{ flex: 1 }}>
        {isAuthOpen ? (
          <AuthPage
            onSuccess={handleLoginSuccess}
            onCancel={() => setIsAuthOpen(false)}
          />
        ) : (
          <>
            {currentTab === 'landing' && (
              <LandingPage onGetStarted={() => (user ? setCurrentTab('discover') : setIsAuthOpen(true))} />
            )}

            {currentTab === 'discover' && user && (
              <DiscoveryPage
                user={user}
                onOpenVerification={() => setCurrentTab('verification')}
                onOpenChat={(convId) => {
                  setActiveConversationId(convId);
                  setCurrentTab('chat');
                }}
              />
            )}

            {currentTab === 'matches' && user && (
              <MatchesPage
                onSelectConversation={(convId) => {
                  setActiveConversationId(convId);
                  setCurrentTab('chat');
                }}
              />
            )}

            {currentTab === 'chat' && user && activeConversationId && (
              <ChatPage
                conversationId={activeConversationId}
                user={user}
                onBack={() => setCurrentTab('matches')}
              />
            )}

            {currentTab === 'verification' && user && (
              <VerificationPage
                user={user}
                onUpdateUser={(updated) => setUser(updated)}
                onDone={() => setCurrentTab('discover')}
              />
            )}

            {currentTab === 'profile' && user && (
              <ProfilePage
                user={user}
                onOpenVerification={() => setCurrentTab('verification')}
              />
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
