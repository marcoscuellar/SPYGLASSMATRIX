/* ============================================================
   Spyglass Matrix — authentication core (server-only)
   Email + password auth with zero external dependencies: scrypt
   password hashing and an HMAC-signed session cookie, both on
   Node's built-in crypto. Route handlers and server components use
   getSession()/requireAuth(); the cookie is httpOnly so client JS
   can never read it.
   ============================================================ */
import { scryptSync, randomBytes, timingSafeEqual, createHmac } from 'crypto';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { Role, Session } from './types';

export const SESSION_COOKIE = 'sm_session';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

// The session cookie is only as good as this secret: anyone who knows it can
// mint a cookie that says role "admin" and walk in. The fallback below is a
// fixed string living in the source tree, so it is not a secret at all — it
// keeps local development runnable and nothing more.
//
// So in production we fail CLOSED. With no AUTH_SECRET set, authReady() is
// false, no session is issued and no session is accepted: the login door is
// shut for everyone, including anyone holding the source. That is the safe
// direction to fail — the alternative is an admin account the whole internet
// can forge its way into. The public client portal does not use sessions and
// is unaffected.
const DEV_SECRET = 'spyglass-matrix-dev-secret-change-me';
const SECRET = process.env.AUTH_SECRET || DEV_SECRET;

/** False when running in production on the built-in fallback secret. */
export function authReady(): boolean {
  return !!process.env.AUTH_SECRET || process.env.NODE_ENV !== 'production';
}

// ---- Password hashing (scrypt) ---------------------------------
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const key = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${key}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, key] = (stored || '').split(':');
  if (!salt || !key) return false;
  const derived = scryptSync(password, salt, 64);
  const keyBuf = Buffer.from(key, 'hex');
  if (keyBuf.length !== derived.length) return false;
  return timingSafeEqual(keyBuf, derived);
}

// ---- Session token (HMAC-signed, url-safe) ---------------------
function b64url(buf: Buffer): string {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function sign(body: string): string {
  return b64url(createHmac('sha256', SECRET).update(body).digest());
}

export function createSessionToken(payload: Omit<Session, 'exp'>): string {
  if (!authReady()) throw new Error('AUTH_SECRET is not set; refusing to issue a session.');
  const full: Session = { ...payload, exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS };
  const body = b64url(Buffer.from(JSON.stringify(full)));
  return `${body}.${sign(body)}`;
}

export function verifySessionToken(token: string | undefined | null): Session | null {
  // A forged cookie signed with the published fallback must never be accepted.
  if (!authReady()) return null;
  if (!token || token.indexOf('.') === -1) return null;
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;
  const expected = sign(body);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const json = Buffer.from(body.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
    const s = JSON.parse(json) as Session;
    if (!s || typeof s.exp !== 'number' || s.exp < Math.floor(Date.now() / 1000)) return null;
    return s;
  } catch {
    return null;
  }
}

// ---- Cookie helpers --------------------------------------------
export function sessionCookieValue(payload: Omit<Session, 'exp'>): { name: string; value: string; options: any } {
  return {
    name: SESSION_COOKIE,
    value: createSessionToken(payload),
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
      maxAge: SESSION_TTL_SECONDS,
    },
  };
}

export function clearedCookie(): { name: string; value: string; options: any } {
  return { name: SESSION_COOKIE, value: '', options: { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' as const, path: '/', maxAge: 0 } };
}

// ---- Reading the session (server components / route handlers) --
export function getSession(): Session | null {
  return verifySessionToken(cookies().get(SESSION_COOKIE)?.value);
}

// Guard a server component: redirect to /login when unauthenticated.
export function requireAuth(): Session {
  const s = getSession();
  if (!s) redirect('/login');
  return s;
}

// Guard an admin-only server component.
export function requireAdmin(): Session {
  const s = requireAuth();
  if (s.role !== 'admin') redirect('/desk');
  return s;
}

// ---- Temp passwords --------------------------------------------
// Friendly, unambiguous temp password to hand to a new user.
export function generateTempPassword(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I/O/0/1
  const bytes = randomBytes(8);
  let out = '';
  for (let i = 0; i < 8; i++) out += alphabet[bytes[i] % alphabet.length];
  return `${out.slice(0, 4)}-${out.slice(4)}`;
}

export function isAuthConfigured(): boolean {
  return !!process.env.AUTH_SECRET;
}

export type { Role };
