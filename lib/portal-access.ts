/* ============================================================
   Spyglass Matrix — client portal door (server-only)
   One shared code the client types once, exchanged for a short
   HMAC-signed pass so the code itself never sits in a cookie.

   The gate is OFF until PORTAL_ACCESS_CODE is set: turning it on
   is a deliberate act, and an unset variable must never lock a
   client out of a link that was already sent to them.
   ============================================================ */
import { createHmac, timingSafeEqual, createHash } from 'crypto';
import { cookies } from 'next/headers';
import { getSession } from './auth';

export const PORTAL_COOKIE = 'sm_portal';
const TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days — a client should type this once

const SECRET = process.env.AUTH_SECRET || 'spyglass-matrix-dev-secret-change-me';

/** The code the client types. Empty means the portal is open to anyone with the link. */
export function portalCode(): string {
  return process.env.PORTAL_ACCESS_CODE || '';
}

/** True when a code is configured, i.e. the door actually exists. */
export function portalGateOn(): boolean {
  return !!portalCode();
}

function b64url(buf: Buffer): string {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function sign(body: string): string {
  return b64url(createHmac('sha256', SECRET).update(body).digest());
}
function eq(a: string, b: string): boolean {
  // Hash both sides so the comparison is constant-time whatever the lengths.
  return timingSafeEqual(createHash('sha256').update(a).digest(), createHash('sha256').update(b).digest());
}

/** Case- and whitespace-insensitive: clients retype this from an email. */
export function checkPortalCode(input: string): boolean {
  if (!portalGateOn()) return false;
  const given = String(input || '').trim().toUpperCase();
  if (!given) return false;
  return eq(given, portalCode().trim().toUpperCase());
}

export function createPortalPass(): string {
  const body = b64url(Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + TTL_SECONDS })));
  return `${body}.${sign(body)}`;
}

function verifyPortalPass(token: string | undefined | null): boolean {
  if (!token || token.indexOf('.') === -1) return false;
  const [body, sig] = token.split('.');
  if (!body || !sig) return false;
  const a = Buffer.from(sig);
  const b = Buffer.from(sign(body));
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
  try {
    const { exp } = JSON.parse(Buffer.from(body.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString());
    return typeof exp === 'number' && exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

/**
 * May this request see the shortlist?
 *  - no code configured  -> yes, the portal is public as before
 *  - a valid portal pass -> yes, the client typed the code
 *  - a logged-in session -> yes, that is us
 */
export function hasPortalAccess(): boolean {
  if (!portalGateOn()) return true;
  if (verifyPortalPass(cookies().get(PORTAL_COOKIE)?.value)) return true;
  return !!getSession();
}

export function portalPassCookie(): { name: string; value: string; options: any } {
  return {
    name: PORTAL_COOKIE,
    value: createPortalPass(),
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
      maxAge: TTL_SECONDS,
    },
  };
}
