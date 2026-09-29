import argon2 from 'argon2';
import crypto from 'crypto';

/**
 * Hash a secret (password, OTP, or refresh token) using Argon2id
 */
export async function hashSecret(secret: string): Promise<string> {
  return argon2.hash(secret, {
    type: argon2.argon2id,
    memoryCost: 2 ** 16, // 64 MB
    timeCost: 3,
    parallelism: 1,
  });
}

/**
 * Verify a secret against an Argon2id hash
 */
export async function verifySecret(hash: string, plain: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, plain);
  } catch {
    return false;
  }
}

/**
 * Enforces canonical ordering: user_a_id < user_b_id
 * Guarantees exactly one bidirectional combination across matches.
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
 * Cryptographically random 6-digit OTP
 */
export function generateRandomOtp(): string {
  const num = crypto.randomInt(100000, 999999);
  return num.toString();
}

/**
 * Generate an opaque random token
 */
export function generateOpaqueToken(byteLength = 32): string {
  return crypto.randomBytes(byteLength).toString('hex');
}
