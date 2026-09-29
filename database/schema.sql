-- ============================================================================
-- ETHIOPIAN DATING PLATFORM - PHASE 2 POSTGRESQL PRODUCTION DDL
-- 20 Canonical Tables, Enums, Constraints, Indexes & Triggers
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. ENUMERATIONS
-- ============================================================================

CREATE TYPE account_status_enum AS ENUM (
    'ACTIVE',
    'SUSPENDED',
    'BANNED',
    'DELETED'
);

CREATE TYPE verification_status_enum AS ENUM (
    'UNVERIFIED',
    'PENDING',
    'VERIFIED',
    'FAILED'
);

CREATE TYPE gender_enum AS ENUM (
    'MALE',
    'FEMALE',
    'OTHER'
);

CREATE TYPE relationship_goal_enum AS ENUM (
    'MARRIAGE',
    'SERIOUS_RELATIONSHIP',
    'DATING',
    'GETTING_TO_KNOW',
    'FRIENDSHIP'
);

CREATE TYPE photo_status_enum AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED'
);

CREATE TYPE device_type_enum AS ENUM (
    'IOS',
    'ANDROID',
    'WEB'
);

CREATE TYPE match_status_enum AS ENUM (
    'ACTIVE',
    'UNMATCHED'
);

CREATE TYPE conversation_status_enum AS ENUM (
    'LOCKED',
    'ACTIVE',
    'CLOSED'
);

CREATE TYPE message_type_enum AS ENUM (
    'TEXT',
    'IMAGE',
    'VOICE',
    'SYSTEM'
);

CREATE TYPE payment_status_enum AS ENUM (
    'PENDING',
    'SUCCESS',
    'FAILED',
    'REFUNDED',
    'CANCELLED'
);

CREATE TYPE report_reason_enum AS ENUM (
    'HARASSMENT',
    'SCAM',
    'FAKE_PROFILE',
    'SEXUAL_CONTENT',
    'THREATS',
    'SPAM',
    'IMPERSONATION',
    'OTHER'
);

CREATE TYPE report_status_enum AS ENUM (
    'PENDING',
    'INVESTIGATING',
    'RESOLVED',
    'DISMISSED'
);

CREATE TYPE notification_type_enum AS ENUM (
    'NEW_MATCH',
    'NEW_MESSAGE',
    'PAYMENT_SUCCESS',
    'VERIFICATION_COMPLETE',
    'REPORT_UPDATE'
);

-- ============================================================================
-- 2. CORE USERS & IDENTITY
-- ============================================================================

-- 1. users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone_number VARCHAR(20) UNIQUE NOT NULL,
    phone_verified BOOLEAN NOT NULL DEFAULT FALSE,
    account_status account_status_enum NOT NULL DEFAULT 'ACTIVE',
    verification_status verification_status_enum NOT NULL DEFAULT 'UNVERIFIED',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT clock_timestamp(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT clock_timestamp(),
    last_active_at TIMESTAMP WITH TIME ZONE
);

-- 2. user_profiles
CREATE TABLE user_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    first_name VARCHAR(50) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender gender_enum NOT NULL,
    city VARCHAR(100) NOT NULL,
    bio TEXT,
    profile_photo_id UUID,
    relationship_goal relationship_goal_enum NOT NULL DEFAULT 'SERIOUS_RELATIONSHIP',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT clock_timestamp(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT clock_timestamp(),
    CONSTRAINT chk_profile_min_age CHECK (date_of_birth <= CURRENT_DATE - INTERVAL '18 years')
);

-- 3. user_preferences
CREATE TABLE user_preferences (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    min_age SMALLINT NOT NULL DEFAULT 18,
    max_age SMALLINT NOT NULL DEFAULT 55,
    preferred_gender gender_enum,
    preferred_city VARCHAR(100),
    relationship_goal relationship_goal_enum,
    max_distance_km INTEGER DEFAULT 50,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT clock_timestamp(),
    CONSTRAINT chk_age_range CHECK (min_age >= 18 AND max_age >= min_age AND max_age <= 100)
);

-- 4. interests
CREATE TABLE interests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) UNIQUE NOT NULL
);

-- 5. user_interests
CREATE TABLE user_interests (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    interest_id UUID NOT NULL REFERENCES interests(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, interest_id)
);

-- 6. verification_records (Isolated identity verification metadata)
CREATE TABLE verification_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL,
    status verification_status_enum NOT NULL DEFAULT 'PENDING',
    provider_reference VARCHAR(128) NOT NULL,
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT clock_timestamp()
);

-- 7. profile_photos
CREATE TABLE profile_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    storage_key TEXT NOT NULL,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    status photo_status_enum NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT clock_timestamp()
);

-- Add foreign key constraint from user_profiles to profile_photos
ALTER TABLE user_profiles 
    ADD CONSTRAINT fk_user_profiles_photo 
    FOREIGN KEY (profile_photo_id) 
    REFERENCES profile_photos(id) 
    ON DELETE SET NULL;

-- 8. sessions
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    refresh_token_hash TEXT NOT NULL,
    device_id VARCHAR(128) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT clock_timestamp(),
    revoked_at TIMESTAMP WITH TIME ZONE
);

-- 9. devices
CREATE TABLE devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_type device_type_enum NOT NULL,
    push_token TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT clock_timestamp(),
    last_seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT clock_timestamp()
);

-- ============================================================================
-- 3. DATING DISCOVERY, LIKES & MATCHING
-- ============================================================================

-- 10. likes
CREATE TABLE likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    to_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT clock_timestamp(),
    CONSTRAINT uq_likes_from_to UNIQUE (from_user_id, to_user_id),
    CONSTRAINT chk_likes_no_self_like CHECK (from_user_id <> to_user_id)
);

-- 11. matches (Enforcing canonical ordering: user_a_id < user_b_id)
CREATE TABLE matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_a_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_b_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status match_status_enum NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT clock_timestamp(),
    ended_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT chk_matches_canonical_order CHECK (user_a_id < user_b_id),
    CONSTRAINT uq_matches_pair UNIQUE (user_a_id, user_b_id)
);

-- ============================================================================
-- 4. CONVERSATIONS & PRIVATE MESSAGING
-- ============================================================================

-- 12. conversations (Locked until payment unlocks it)
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID UNIQUE NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    status conversation_status_enum NOT NULL DEFAULT 'LOCKED',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT clock_timestamp(),
    unlocked_at TIMESTAMP WITH TIME ZONE
);

-- 13. conversation_members
CREATE TABLE conversation_members (
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT clock_timestamp(),
    PRIMARY KEY (conversation_id, user_id)
);

-- 14. messages
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message_type message_type_enum NOT NULL DEFAULT 'TEXT',
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT clock_timestamp(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- 15. message_reads
CREATE TABLE message_reads (
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    read_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT clock_timestamp(),
    PRIMARY KEY (message_id, user_id)
);

-- ============================================================================
-- 5. PAYMENTS (ONE-PAYMENT-PER-CONVERSATION)
-- ============================================================================

-- 16. payments
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL,
    provider_reference VARCHAR(128) UNIQUE NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'ETB',
    status payment_status_enum NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT clock_timestamp(),
    completed_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT chk_payment_amount CHECK (amount > 0),
    CONSTRAINT uq_payment_user_conversation UNIQUE (user_id, conversation_id)
);

-- ============================================================================
-- 6. SAFETY, MODERATION, NOTIFICATIONS & AUDITING
-- ============================================================================

-- 17. blocks
CREATE TABLE blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blocker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    blocked_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT clock_timestamp(),
    CONSTRAINT uq_blocks_pair UNIQUE (blocker_id, blocked_id),
    CONSTRAINT chk_blocks_no_self_block CHECK (blocker_id <> blocked_id)
);

-- 18. reports
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    reported_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
    reason report_reason_enum NOT NULL,
    description TEXT,
    status report_status_enum NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT clock_timestamp(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT chk_reports_distinct CHECK (reporter_id <> reported_user_id)
);

-- 19. notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type notification_type_enum NOT NULL,
    title VARCHAR(150) NOT NULL,
    body TEXT NOT NULL,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT clock_timestamp()
);

-- 20. audit_logs (Immutable audit trail)
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_user_id UUID NOT NULL,
    action VARCHAR(100) NOT NULL,
    target_type VARCHAR(50) NOT NULL,
    target_id UUID NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT clock_timestamp()
);

-- ============================================================================
-- 7. PERFORMANCE INDEXES
-- ============================================================================

-- Users & Profiles
CREATE INDEX idx_users_phone ON users (phone_number);
CREATE INDEX idx_users_status_verif ON users (account_status, verification_status);
CREATE INDEX idx_user_profiles_user ON user_profiles (user_id);
CREATE INDEX idx_user_profiles_discovery ON user_profiles (gender, city);

-- Discovery, Likes & Matches
CREATE INDEX idx_likes_from_to ON likes (from_user_id, to_user_id);
CREATE INDEX idx_likes_to ON likes (to_user_id);
CREATE INDEX idx_matches_pair ON matches (user_a_id, user_b_id);
CREATE INDEX idx_matches_user_a ON matches (user_a_id) WHERE status = 'ACTIVE';
CREATE INDEX idx_matches_user_b ON matches (user_b_id) WHERE status = 'ACTIVE';

-- Conversations & Messaging
CREATE INDEX idx_conversations_match ON conversations (match_id);
CREATE INDEX idx_conversations_status ON conversations (status);
CREATE INDEX idx_conv_members_user ON conversation_members (user_id);
CREATE INDEX idx_conv_members_composite ON conversation_members (conversation_id, user_id);
CREATE INDEX idx_messages_conv_created ON messages (conversation_id, created_at DESC);
CREATE INDEX idx_message_reads_lookup ON message_reads (message_id, user_id);

-- Payments
CREATE INDEX idx_payments_user_conv ON payments (user_id, conversation_id);
CREATE INDEX idx_payments_reference ON payments (provider_reference);
CREATE INDEX idx_payments_status ON payments (status);

-- Blocks & Reports
CREATE INDEX idx_blocks_lookup ON blocks (blocker_id, blocked_id);
CREATE INDEX idx_blocks_reverse ON blocks (blocked_id, blocker_id);
CREATE INDEX idx_reports_reported_status ON reports (reported_user_id, status);

-- Notifications & Audit
CREATE INDEX idx_notifications_user_read ON notifications (user_id, read_at);
CREATE INDEX idx_audit_logs_actor ON audit_logs (actor_user_id);
CREATE INDEX idx_audit_logs_target ON audit_logs (target_type, target_id);
CREATE INDEX idx_sessions_user_active ON sessions (user_id) WHERE revoked_at IS NULL;
CREATE INDEX idx_devices_user ON devices (user_id);
