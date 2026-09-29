# 🇪🇹 Ethiopian Dating Platform — Backend API

Production-ready TypeScript modular monolith powering the Ethiopian Dating Platform. Built with Node.js, Express, Prisma ORM, PostgreSQL, and WebSockets.

---

## Architectural Principles & Business Rules

1. **Identity Verification Isolation**:
   * Personal verification records (national ID tokens, biometric liveness logs) reside in isolated schemas/vaults.
   * Public dating profiles contain **zero** personal identity documents.
   * Only verified members enter the active dating pool. Unverified members receive teaser feeds with server-blurred photos.
2. **Canonical Matching & Conversations**:
   * All bidirectional pairs (matches and conversations) enforce `user_low_id < user_high_id` via compound uniqueness constraints, eliminating duplicate pairing permutations.
3. **Pay-Per-Conversation Architecture**:
   * A match does **not** allow free messaging.
   * Matches create a conversation in locked state (`is_unlocked = false`).
   * One verified payment (via Telebirr, Chapa, or CBE Birr) unlocks that unique 1-on-1 conversation permanently.
   * Unlocking is authorized **strictly** via verified server-to-server webhook callbacks—never client assertions.
4. **Relationship Privacy**:
   * Users can only query conversations they are a direct participant of.
   * No user can inspect or infer another user's active matches or concurrent conversations.

---

## Project Structure

```text
backend/
├── prisma/
│   ├── schema.prisma       # Database schema & relations
│   └── seed.ts             # Seeding script (cultural interests, test users, admin)
├── src/
│   ├── config/             # Typed environment configurations
│   ├── database/           # Prisma client singleton
│   ├── common/             # Standard response helpers, AppError hierarchy, crypto utils
│   ├── middleware/         # JWT auth, verification guard, admin RBAC, rate limiters
│   ├── realtime/           # WebSocket server gateway (/ws)
│   ├── modules/
│   │   ├── auth/           # Phone E.164 OTP registration & session rotation
│   │   ├── verification/   # Identity verification submission & webhook processor
│   │   ├── profiles/       # Dating profile CRUD, dual photos, preferences, interests
│   │   ├── discovery/      # Feed filtering & server-blurred teaser card generator
│   │   ├── likes/          # Directed likes & atomic mutual match detection
│   │   ├── matches/        # Active matches list & unmatching
│   │   ├── conversations/  # Conversation state & paywall verification
│   │   ├── messages/       # Paywall-protected messaging & real-time socket broadcast
│   │   ├── payments/       # Pay-per-conversation orders & idempotent webhooks
│   │   ├── blocks/         # Immediate bilateral communication block
│   │   ├── reports/        # Safety & abuse report ingestion
│   │   └── admin/          # RBAC portal, moderation queue & audit logs
│   ├── app.ts              # Express application setup
│   └── server.ts           # HTTP + WebSocket server startup
├── dist/                   # Compiled production JS output
├── .env.example            # Environment template
└── package.json
```

---

## Getting Started

### 1. Prerequisites
* **Node.js** (v18+)
* **PostgreSQL** (v14+)

### 2. Environment Configuration
Copy the template configuration:
```bash
cp .env.example .env
```
Ensure your `DATABASE_URL` is set to your PostgreSQL instance:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/dating_app?schema=app"
```

### 3. Database Migration & Client Generation
```bash
# Generate Prisma Client
npm run prisma:generate

# Push schema directly to database
npm run prisma:push

# Seed cultural interests, test accounts, and super admin
npm run prisma:seed
```

### 4. Running the Application
```bash
# Development mode with hot-reloading
npm run dev

# Production build
npm run build
npm start
```

---

## API Endpoints Reference

### Authentication (`/api/v1/auth`)
| Method | Path | Protected | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/request-otp` | No (Rate-limited) | Requests 6-digit OTP code to phone number |
| `POST` | `/verify-otp` | No (Rate-limited) | Verifies OTP code; returns JWT tokens and user standing |
| `POST` | `/refresh` | No | Rotates access token using refresh token |
| `POST` | `/logout` | Yes | Revokes current device session |
| `GET` | `/me` | Yes | Returns current authenticated user state |

### Identity Verification (`/api/v1/verification`)
| Method | Path | Protected | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/submit` | Yes | Submits national ID / liveness session token |
| `GET` | `/status` | Yes | Queries verification standing (`VERIFIED`, `PENDING_REVIEW`) |
| `POST` | `/webhook` | No (HMAC signed) | External KYC / Fayda callback |

### Profiles & Preferences (`/api/v1/profiles`)
| Method | Path | Protected | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/me` | Yes | Returns authenticated user's dating profile |
| `PUT` | `/me` | Yes | Upserts dating profile attributes |
| `POST` | `/photos` | Yes | Adds photo (stores original and server-blurred preview) |
| `DELETE` | `/photos/:photoId` | Yes | Removes profile photo |
| `PUT` | `/preferences` | Yes | Updates discovery age, gender, and city filters |
| `GET` | `/interests` | No | Lists predefined cultural & lifestyle tags |

### Discovery & Swiping (`/api/v1/discovery`)
| Method | Path | Protected | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/feed` | Yes | Returns eligible dating pool. Unverified users receive teaser cards with blurred photos. |

### Likes & Passes (`/api/v1/likes`)
| Method | Path | Protected | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/` | Yes (Verified only) | Like target profile. Automatically creates match & conversation on mutual like. |
| `POST` | `/pass` | Yes | Pass target profile (excluded from future discovery). |

### Matches (`/api/v1/matches`)
| Method | Path | Protected | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | Yes (Verified only) | Lists active mutual matches with conversation unlock status. |
| `POST` | `/:matchId/unmatch` | Yes | Unmatches user. |

### Conversations (`/api/v1/conversations`)
| Method | Path | Protected | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | Yes (Verified only) | Lists private conversations for current user. |
| `GET` | `/:conversationId` | Yes (Verified only) | Returns conversation status & partner details. |

### Messages & Realtime Chat (`/api/v1/messages`)
| Method | Path | Protected | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/:conversationId` | Yes (Verified only) | Sends message. Enforces `is_unlocked = true` and block checks. |
| `GET` | `/:conversationId` | Yes (Verified only) | Fetches paginated message history for unlocked conversation. |

### Payments (`/api/v1/payments`)
| Method | Path | Protected | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/initiate` | Yes (Verified only) | Creates payment order to unlock a specific conversation. |
| `POST` | `/webhooks/chapa` | No (HMAC signed) | Chapa payment webhook; unlocks conversation idempotently. |
| `POST` | `/mock-gateway-checkout/:orderId` | Dev only | Development simulation to trigger payment unlock. |

### Safety, Blocks & Reports (`/api/v1/blocks`, `/api/v1/reports`)
| Method | Path | Protected | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/blocks` | Yes | Blocks user immediately. |
| `DELETE` | `/blocks/:targetUserId` | Yes | Unblocks user. |
| `GET` | `/blocks` | Yes | Lists blocked users. |
| `POST` | `/reports` | Yes | Submits report into moderation queue. |

### Admin Portal & Moderation (`/api/v1/admin`)
| Method | Path | Protected | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/login` | No | Staff authentication (returns 8h JWT). |
| `GET` | `/dashboard` | Admin/Mod | Metrics: verified rates, matches, unlocked conversations, revenue. |
| `GET` | `/reports` | Admin/Mod | Lists abuse/safety reports with filtering. |
| `POST` | `/moderation/action` | Admin/Mod | Issues warning, suspension, or permanent ban with mandatory audit log. |
| `GET` | `/audit-logs` | Admin | Full immutable compliance log of administrative actions. |

---

## WebSocket Gateway (`/ws`)
Connect to real-time messaging using:
```
ws://localhost:5000/ws?token=<ACCESS_TOKEN>
```
Real-time events pushed by the server:
* `CONNECTED`: `{ type: "CONNECTED", userId: "uuid" }`
* `NEW_MESSAGE`: `{ type: "NEW_MESSAGE", message: { id, conversationId, senderId, content, createdAt } }`
