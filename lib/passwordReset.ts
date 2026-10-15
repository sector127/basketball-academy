import crypto from 'node:crypto';

export const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

export interface ResetTokenPayload {
  token: string;
  tokenHash: string;
  expiresAt: Date;
}

// Only a hash of the token is stored, so a database leak doesn't expose usable links
export function hashResetToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function createResetToken(): ResetTokenPayload {
  const token = crypto.randomBytes(32).toString('hex');
  return {
    token,
    tokenHash: hashResetToken(token),
    expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
  };
}
