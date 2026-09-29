import crypto from 'crypto';

/**
 * Ensures strict canonical ordering so that user_low_id < user_high_id.
 * This guarantees exactly one combination per two users across matches and conversations.
 */
export function getCanonicalPair(userId1: string, userId2: string): { userLowId: string; userHighId: string } {
  if (userId1 === userId2) {
    throw new Error('A user cannot be paired with themselves');
  }
  return userId1 < userId2
    ? { userLowId: userId1, userHighId: userId2 }
    : { userLowId: userId2, userHighId: userId1 };
}

/**
 * Generates a cryptographically random 6-digit OTP
 */
export function generateRandomOtp(): string {
  const num = crypto.randomInt(100000, 999999);
  return num.toString();
}

/**
 * Generates an opaque random token (for verification references, idempotency keys, etc.)
 */
export function generateOpaqueToken(byteLength = 32): string {
  return crypto.randomBytes(byteLength).toString('hex');
}
