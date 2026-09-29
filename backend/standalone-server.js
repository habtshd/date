const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.raw({ type: '*/*', limit: '10mb' }));

// In-memory State Store
const state = {
  users: new Map(),
  profiles: new Map(),
  otps: new Map(),
  likes: new Set(),
  matches: new Map(),
  conversations: new Map(),
  messages: new Map(),
  photos: new Map(),
  verification: new Map(),
};

// Seed sample discovery profiles for immediate rich UX
const sampleProfiles = [
  {
    userId: 'usr-bethlehem',
    firstName: 'Bethlehem',
    dateOfBirth: '1999-04-18',
    age: 25,
    gender: 'FEMALE',
    city: 'Addis Ababa',
    relationshipGoal: 'MARRIAGE',
    bio: 'Passionate about architectural heritage, coffee culture, and Sunday hikes in Entoto.',
    interests: ['Coffee Ceremony', 'Traditional Music', 'Architecture', 'Hiking'],
    photos: [
      {
        id: 'p-1',
        url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
        isPrimary: true,
        order: 0,
      },
    ],
    isVerified: true,
  },
  {
    userId: 'usr-dawit',
    firstName: 'Dawit',
    dateOfBirth: '1996-09-12',
    age: 28,
    gender: 'MALE',
    city: 'Addis Ababa',
    relationshipGoal: 'SERIOUS_RELATIONSHIP',
    bio: 'Software engineer building fintech solutions. Enjoys Ethiopian literature, running, and jazz.',
    interests: ['Tech & Startups', 'Running / Athletics', 'Ethiopian Literature'],
    photos: [
      {
        id: 'p-2',
        url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80',
        isPrimary: true,
        order: 0,
      },
    ],
    isVerified: true,
  },
  {
    userId: 'usr-selam',
    firstName: 'Selamawit',
    dateOfBirth: '1998-02-20',
    age: 26,
    gender: 'FEMALE',
    city: 'Addis Ababa',
    relationshipGoal: 'MARRIAGE',
    bio: 'Medical researcher who loves traditional poetry, travel, and spending time with family.',
    interests: ['Nature & Outdoors', 'Reading & Books', 'Coffee Ceremony'],
    photos: [
      {
        id: 'p-3',
        url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80',
        isPrimary: true,
        order: 0,
      },
    ],
    isVerified: true,
  },
];

sampleProfiles.forEach((p) => state.profiles.set(p.userId, p));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Auth: Send OTP
app.post('/api/v1/auth/send-otp', (req, res) => {
  const { phoneNumber } = req.body || {};
  console.log(`[AUTH] SMS OTP requested for: ${phoneNumber}`);
  state.otps.set(phoneNumber, '123456');
  res.json({
    success: true,
    message: 'Verification code sent successfully. Use code 123456 for testing.',
    demoCode: '123456',
  });
});

// Auth: Register (alias)
app.post('/api/v1/auth/register', (req, res) => {
  const { phoneNumber } = req.body || {};
  console.log(`[AUTH] Registration for: ${phoneNumber}`);
  state.otps.set(phoneNumber, '123456');
  res.json({ success: true, message: 'Verification code sent.' });
});

// Auth: Verify OTP
app.post('/api/v1/auth/verify-otp', (req, res) => {
  const { phoneNumber, code } = req.body || {};
  console.log(`[AUTH] Verifying code '${code}' for ${phoneNumber}`);

  let user = Array.from(state.users.values()).find((u) => u.phoneNumber === phoneNumber);
  if (!user) {
    user = {
      id: `usr-${Date.now()}`,
      phoneNumber: phoneNumber || '+251911223344',
      verificationStatus: 'VERIFIED', // Verified for seamless discovery
      isPhoneVerified: true,
      hasProfile: false,
      role: 'USER',
    };
    state.users.set(user.id, user);
  }

  const token = `token-${user.id}`;
  res.json({
    accessToken: token,
    refreshToken: `refresh-${user.id}`,
    user,
  });
});

// Current User Me
app.get(['/api/v1/users/me', '/api/v1/auth/me'], (req, res) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '');
  const userId = token.replace('token-', '');

  const user = state.users.get(userId) || {
    id: userId || 'usr-default',
    phoneNumber: '+251911223344',
    verificationStatus: 'VERIFIED',
    isPhoneVerified: true,
    hasProfile: true,
    role: 'USER',
  };

  res.json(user);
});

// Profile endpoints
app.get('/api/v1/profile', (req, res) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '');
  const userId = token.replace('token-', '');

  const profile = state.profiles.get(userId) || null;
  res.json({ profile });
});

app.post('/api/v1/profile', (req, res) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '');
  const userId = token.replace('token-', '');

  const profile = {
    userId,
    ...req.body,
    age: 26,
    isVerified: true,
    photos: req.body.photos || [],
  };

  state.profiles.set(userId, profile);
  const user = state.users.get(userId);
  if (user) user.hasProfile = true;

  console.log(`[PROFILE] Created profile for user ${userId}:`, profile.firstName);
  res.json({ profile });
});

app.patch('/api/v1/profile', (req, res) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '');
  const userId = token.replace('token-', '');

  const existing = state.profiles.get(userId) || {};
  const updated = { ...existing, ...req.body };
  state.profiles.set(userId, updated);
  res.json({ profile: updated });
});

app.put('/api/v1/profile/preferences', (req, res) => {
  res.json({ success: true, preferences: req.body });
});

app.post('/api/v1/profile/interests', (req, res) => {
  res.json({ success: true, interests: req.body });
});

// Presigned photo upload URL
app.post('/api/v1/profile/photos/upload-url', (req, res) => {
  const key = `profiles/${Date.now()}.jpg`;
  const uploadUrl = `http://localhost:${PORT}/upload/${key}`;
  res.json({
    uploadUrl,
    storageKey: key,
  });
});

// Handle direct photo upload
app.put('/upload/*', (req, res) => {
  res.status(200).send('OK');
});

// Complete photo upload
app.post('/api/v1/profile/photos/complete', (req, res) => {
  const { storageKey } = req.body || {};
  res.json({
    id: `photo-${Date.now()}`,
    storageKey,
    url: `http://localhost:${PORT}/upload/${storageKey}`,
    isPrimary: true,
  });
});

// Verification endpoints
app.post('/api/v1/verification/start', (req, res) => {
  res.json({
    verificationId: `ver-${Date.now()}`,
    status: 'VERIFIED',
    redirectUrl: 'https://fayda.et/mock-verify',
  });
});

app.get('/api/v1/verification/status', (req, res) => {
  res.json({
    status: 'VERIFIED',
    isVerified: true,
  });
});

// Discovery feed
app.get('/api/v1/discovery', (req, res) => {
  const profiles = Array.from(state.profiles.values());
  res.json({ profiles });
});

app.get('/api/v1/discovery/preview', (req, res) => {
  const profiles = Array.from(state.profiles.values()).map((p) => ({
    ...p,
    photos: p.photos.map((ph) => ({ ...ph, url: ph.url })),
  }));
  res.json({ profiles });
});

// Likes & Matching
app.post('/api/v1/likes/:userId', (req, res) => {
  const targetId = req.params.userId;
  console.log(`[LIKE] Liked target user: ${targetId}`);

  // Auto-match: 100% FREE chat for all mutual matches
  const conversationId = `conv-${Date.now()}`;
  const conversation = {
    id: conversationId,
    otherUserId: targetId,
    otherUserName: 'Bethlehem',
    status: 'ACTIVE',
    isUnlocked: true,
    chatFeeEtb: 0.0,
  };
  state.conversations.set(conversationId, conversation);

  res.json({
    matched: true,
    conversationId,
  });
});

app.post('/api/v1/passes/:userId', (req, res) => {
  res.json({ success: true });
});

// Matches list
app.get('/api/v1/matches', (req, res) => {
  const list = [
    {
      id: 'match-1',
      matchedUserId: 'usr-bethlehem',
      firstName: 'Bethlehem',
      age: 25,
      city: 'Addis Ababa',
      photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      matchedAt: new Date().toISOString(),
      conversationId: 'conv-101',
      isConversationActive: true,
    },
  ];
  res.json({ matches: list });
});

// Conversations & Messages
app.get('/api/v1/conversations/:id', (req, res) => {
  const conv = state.conversations.get(req.params.id) || {
    id: req.params.id,
    otherUserId: 'usr-bethlehem',
    otherUserName: 'Bethlehem',
    status: 'ACTIVE',
    isUnlocked: true,
    chatFeeEtb: 0.0,
  };
  res.json(conv);
});

app.get('/api/v1/conversations/:id/messages', (req, res) => {
  const msgs = state.messages.get(req.params.id) || [
    {
      id: 'msg-1',
      senderId: 'usr-bethlehem',
      content: 'Selam! So glad we matched on Sovereign.',
      createdAt: new Date().toISOString(),
    },
  ];
  res.json({ messages: msgs });
});

app.post('/api/v1/conversations/:id/messages', (req, res) => {
  const { content } = req.body || {};
  const msg = {
    id: `msg-${Date.now()}`,
    senderId: 'me',
    content,
    createdAt: new Date().toISOString(),
  };

  const existing = state.messages.get(req.params.id) || [];
  existing.push(msg);
  state.messages.set(req.params.id, existing);

  res.json({ message: msg });
});

// Payments
app.post(['/api/v1/conversations/:id/payment', '/api/v1/payments/create'], (req, res) => {
  const convId = req.params.id || req.body.conversationId;
  const conv = state.conversations.get(convId);
  if (conv) {
    conv.status = 'ACTIVE';
    conv.isUnlocked = true;
  }
  res.json({
    paymentId: `pay-${Date.now()}`,
    amount: 150.0,
    currency: 'ETB',
    provider: 'TELEBIRR',
    status: 'SUCCESS',
    checkoutUrl: 'https://telebirr.et/pay-mock',
  });
});

app.get('/api/v1/payments/:id/status', (req, res) => {
  res.json({ status: 'SUCCESS' });
});

// Notifications
app.get('/api/v1/notifications', (req, res) => {
  res.json({
    notifications: [
      {
        id: 'n-1',
        title: 'Identity Verified!',
        body: 'Your Fayda ID has been verified. Welcome to Sovereign!',
        type: 'VERIFICATION_COMPLETE',
        createdAt: new Date().toISOString(),
        readAt: null,
      },
    ],
  });
});

// Start Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`====================================================`);
  console.log(`🇪🇹 Sovereign Local Standalone Server Active!`);
  console.log(`🚀 API Base:    http://localhost:${PORT}/api/v1`);
  console.log(`🔑 Test OTP:    123456 (works for all phone numbers)`);
  console.log(`🩺 Health:      http://localhost:${PORT}/health`);
  console.log(`====================================================`);
});
