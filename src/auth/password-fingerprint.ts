import { createHmac, timingSafeEqual } from 'crypto';

// A secret-keyed digest of a member's stored password hash, carried in the JWT as
// `pwv`. Every password change writes a new bcrypt hash (fresh salt), so tokens
// issued before it stop matching and JwtStrategy rejects them. HMAC rather than any
// part of the hash itself, because JWT payloads are readable by the client.
export function passwordFingerprint(passwordHash: string): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not set.');
  }
  return createHmac('sha256', secret).update(passwordHash).digest('base64url');
}

export function fingerprintMatches(passwordHash: string | null | undefined, claimed: unknown): boolean {
  if (!passwordHash || typeof claimed !== 'string') {
    return false;
  }
  const expected = Buffer.from(passwordFingerprint(passwordHash));
  const actual = Buffer.from(claimed);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
