# Dating — Identity-Verified Ethiopian Dating Platform

> **Authentic Dating, Guaranteed by Fayda National Identity & Telebirr Protection.**

---

## 🏛️ System Architecture

```text
                                     DATING PLATFORM     
                                            │
                       ┌────────────────────┴────────────────────┐
                       │                                         │
              Flutter Mobile App                          Web Application
                 (iOS / Android)                         (React / Vite SPA)
                       │                                         │
                       └────────────────────┬────────────────────┘
                                            │
                                       REST / WSS
                                            │
                                  ┌─────────▼─────────┐
                                  │   Fastify Backend │
                                  │   (TypeScript)    │
                                  └─────────┬─────────┘
                                            │
                     ┌──────────────────────┼──────────────────────┐
                     ▼                      ▼                      ▼
            PostgreSQL Database       Redis Cache & Queue     MinIO S3 Storage
            (Prisma ORM)              (BullMQ Workers)        (Profile Photos)
```

---

## 📋 The 43 Implementation Milestones — Complete Status

| # | Milestone | Subsystem | Status | Description |
|---|---|---|:---:|---|
| **01** | Architecture | System | ✅ Complete | Modular monolith architecture, security authority separation |
| **02** | Database | DB | ✅ Complete | PostgreSQL + Prisma schema, strict unique constraints (`userAId < userBId`) |
| **03** | Backend Foundation | Backend | ✅ Complete | Fastify, TypeScript, Redis, BullMQ, Argon2id, Zod |
| **04** | Authentication | Backend | ✅ Complete | Phone OTP, refresh session rotation, rate limiting |
| **05** | Profiles | Backend | ✅ Complete | CRUD, adult age validation (18+), Ethiopian cities |
| **06** | Preferences | Backend | ✅ Complete | Age range, preferred gender, city, relationship goal |
| **07** | Interests | Backend | ✅ Complete | Curated Ethiopian passions taxonomy (`UserInterest`) |
| **08** | Photos | Backend | ✅ Complete | Presigned upload URL flow, direct S3 upload, EXIF strip |
| **09** | Identity Verification | Backend | ✅ Complete | Fayda provider abstraction, HMAC signed webhooks |
| **10** | Verification Gate | Backend | ✅ Complete | `requireVerified` middleware; unverified preview vs verified pool |
| **11** | Discovery | Backend | ✅ Complete | Server filtering: active, verified, not blocked, safe DTO |
| **12** | Likes | Backend | ✅ Complete | Atomic `Like` creation, self-like prevention |
| **13** | Passes | Backend | ✅ Complete | `Pass` tracking with cooldown exclusion |
| **14** | Matches | Backend | ✅ Complete | Mutual like detection, deterministic match ID, locked conversation |
| **15** | Payments | Backend | ✅ Complete | Per-conversation payment, Telebirr & Chapa provider abstraction |
| **16** | Conversations | Backend | ✅ Complete | Locked -> Active state transition on webhook confirmation |
| **17** | Messages | Backend | ✅ Complete | Text & system message bubbles, authorization checks |
| **18** | WebSocket | Backend | ✅ Complete | Fastify WebSocket server, live room subscription, typing events |
| **19** | Blocks | Backend | ✅ Complete | Bidirectional platform-wide exclusion policy |
| **20** | Reports | Backend | ✅ Complete | Categorized safety reports (harassment, spam, fake profiles) |
| **21** | Moderation | Backend | ✅ Complete | Moderator queue, status transitions, account suspension/ban |
| **22** | Notifications | Backend | ✅ Complete | Privacy-masked push notification dispatch |
| **23** | Background Jobs | Backend | ✅ Complete | BullMQ workers for cleanup, expiry, and notification retry |
| **24** | Security Hardening | Backend | ✅ Complete | Centralized `AppError`, Helmet headers, CORS, rate limiting |
| **25** | Backend Tests | Backend | ✅ Complete | Comprehensive test matrix (all suites passing) |
| **26** | Flutter Foundation | Mobile | ✅ Complete | Obsidian & Ethiopian gold theme, Riverpod, GoRouter, Dio |
| **27** | Flutter Auth | Mobile | ✅ Complete | Splash, Welcome, Phone registration, OTP entry |
| **28** | Flutter Onboarding | Mobile | ✅ Complete | 5-step flow: Profile, Preferences, Interests, Photos, Preview |
| **29** | Flutter Verification | Mobile | ✅ Complete | Fayda biometric check, status polling, verification prompt |
| **30** | Flutter Discovery | Mobile | ✅ Complete | Swipeable card stack, unverified blurred preview mode |
| **31** | Flutter Likes/Matches | Mobile | ✅ Complete | Swipe right (Like), swipe left (Pass), "It's a Match!" celebration |
| **32** | Flutter Payments | Mobile | ✅ Complete | Telebirr / Chapa payment sheet, 150 ETB checkout, unlock polling |
| **33** | Flutter Chat | Mobile | ✅ Complete | Real-time private chat, locked paywall, WebSocket integration |
| **34** | Flutter Safety | Mobile | ✅ Complete | Report user dialog, block user confirmation, safety policies |
| **35** | Flutter Notifications | Mobile | ✅ Complete | Dedicated Notification Center, unread state, type badges |
| **36** | Flutter Testing | Mobile | ✅ Complete | 11 unit & widget test suites passing, 0 analyzer issues |
| **37** | Web Application | Web | ✅ Complete | React + Vite client, landing page, discovery cards, chat |
| **38** | Admin Dashboard | Admin | ✅ Complete | Command Center: verification queue, moderation, ledger, audit logs |
| **39** | Integration Testing | DevOps | ✅ Complete | Cross-platform validation and API communication tests |
| **40** | Production Deployment | DevOps | ✅ Complete | Multi-container Docker Compose + Caddy TLS reverse proxy |
| **41** | Monitoring & Backups | DevOps | ✅ Complete | Healthchecks, automated daily backup & restore scripts |
| **42** | Mobile App Release | DevOps | ✅ Complete | Android Gradle / iOS Info.plist release guidelines |
| **43** | Launch Checklist | Operations | ✅ Complete | Pre-flight security audit, environment variables, runbook |

---

## 🚀 Quick Start Guide

### Option 1: Full Platform via Docker Compose (Recommended)

Run all services (Database, Redis, S3 MinIO, Fastify API, Web App, Admin App, Caddy reverse proxy) with one command:

```bash
docker-compose up -d --build
```

- **User Web App**: `http://localhost:5173` (or `https://app.sovereigndate.et`)
- **Admin Command Center**: `http://localhost:5174` (or `https://admin.sovereigndate.et`)
- **Fastify API**: `http://localhost:3000` (or `https://api.sovereigndate.et`)
- **MinIO Storage Console**: `http://localhost:9001` (user: `sovereign_minio`, pass: `sovereign_minio_secret`)

---

### Option 2: Running Components Individually in Development

#### 1. Backend (Fastify API)
```bash
cd backend
npm install
npm test          # Run all security and architecture unit tests
npm run dev       # Starts server on http://localhost:3000
```

#### 2. Mobile App (Flutter)
```bash
cd dating_app
flutter pub get
flutter test      # Run all 11 unit & widget test suites
flutter run       # Launch on iOS Simulator, Android Emulator, or device
```

#### 3. Web User Application (React + Vite)
```bash
cd web
npm install
npm run dev       # Starts client on http://localhost:5173
npm run build     # Compiles production bundle to dist/
```

#### 4. Admin Command Center (React + Vite)
```bash
cd admin
npm install
npm run dev       # Starts admin on http://localhost:5174
npm run build     # Compiles production bundle to dist/
```

---

## 🔒 Security Principles

1. **Client is Never Authority**: The client displays and requests; the Fastify backend decides and authorizes.
2. **Zero Biometrics Storage**: Only the cryptographic verification result (`VERIFIED`) is stored. Raw national ID photos and selfie scans are never persisted in the dating database.
3. **Intentional Conversations**: One match $\rightarrow$ one conversation $\rightarrow$ one-time payment unlock (150 ETB via Telebirr or Chapa) $\rightarrow$ unlimited messages.
4. **Privacy Isolation**: Discovery DTOs strictly omit phone numbers, exact addresses, and private reports.
5. **Bidirectional Safety**: Blocking immediately suppresses profiles across Discovery, Likes, Matches, and Chat with zero leakage.
