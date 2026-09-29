import crypto from 'crypto';

/**
 * Ensures strict canonical ordering so that user_a_id < user_b_id.
 * This guarantees exactly one combination per two users across matches.
 */
export function getCanonicalPair(userId1: string, userId2: string): { userAId: string; userBId: string } {
  if (userId1 === userId2) {
    throw new Error('A user cannot be paired with themselves');
  }
  return userId1 < userId2
    ? { userAId: userId1, userBId: userId2 }
    : { userAId: userId2, userBId: userId1 };
}

/**
 * Generates a cryptographically random 6-digit OTP
 */
export function generateRandomOtp(): string {
  const num = crypto.randomInt(100000, 999999);
  return num.toString();
}

/**
 * Generates an opaque random token (for verification references, payment references, etc.)
 */
export function generateOpaqueToken(byteLength = 32): string {
  return crypto.randomBytes(byteLength).toString('hex');
}
