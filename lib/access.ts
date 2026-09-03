/* ============================================================
   Spyglass Matrix — recruiter workroom access code (server-only)
   A lighter door than the email+password login: one shared code
   that unlocks /workroom. The code itself is never stored in a
   cookie — redeeming it mints a short HMAC-signed pass, so the
   code cannot be recovered from a stolen browser session.
   ============================================================ */
import { createHmac, timingSafeEqual, createHash } from 'crypto';
import { cookies } from 'next/headers';

export const ACCESS_COOKIE = 'sm_workroom';
const TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days, same as the login session

const SECRET = process.env.AUTH_SECRET || 'spyglass-matrix-dev-secret-change-me';

/** The shared code recruiters type in. Set WORKROOM_ACCESS_CODE in the env to rotate it. */
export function accessCode(): string {
  return process.env.WORKROOM_ACCESS_CODE || 'OLLIN-WORKROOM';
}

/** True when the deployment is still on the built-in default code. */
export function usingDefaultCode(): boolean {
  return !process.env.WORKROOM_ACCESS_CODE;
}

// Same reasoning as AUTH_SECRET in lib/auth.ts: the default code and the
// fallback signing secret both sit in the source tree, so in production
// without WORKROOM_ACCESS_CODE and AUTH_SECRET the door is not a door. Fail
// closed — no code is accepted and no existing pass is honoured — rather than
// leave the recruiters' internal search strategy open to anyone with the URL.
export function workroomReady(): boolean {
  if (process.env.NODE_ENV !== 'production') return true;
  return !!process.env.WORKROOM_ACCESS_CODE && !!process.env.AUTH_SECRET;
}

function b64url(buf: Buffer): string {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function sign(body: string): string {
  return b64url(createHmac('sha256', SECRET).update(body).digest());
}
function eq(a: string, b: string): boolean {
  // Hash both sides first so the comparison is constant-time regardless of length.
  const ha = createHash('sha256').update(a).digest();
  const hb = createHash('sha256').update(b).digest();
  return timingSafeEqual(ha, hb);
}

/** Case- and whitespace-insensitive: recruiters retype these by hand. */
export function checkCode(input: string): boolean {
  if (!workroomReady()) return false;
  const given = String(input || '').trim().toUpperCase();
  if (!given) return false;
  return eq(given, accessCode().trim().toUpperCase());
}

export function createPass(): string {
  const body = b64url(Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + TTL_SECONDS })));
  return `${body}.${sign(body)}`;
}

export function verifyPass(token: string | undefined | null): boolean {
  if (!workroomReady()) return false;
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

export function passCookie(): { name: string; value: string; options: any } {
  return {
    name: ACCESS_COOKIE,
    value: createPass(),
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
      maxAge: TTL_SECONDS,
    },
  };
}

export function clearPassCookie(): { name: string; value: string; options: any } {
  return { name: ACCESS_COOKIE, value: '', options: { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' as const, path: '/', maxAge: 0 } };
}

/** Server components: has this browser redeemed a valid code? */
export function hasAccess(): boolean {
  return verifyPass(cookies().get(ACCESS_COOKIE)?.value);
}

/* ---- Attempt throttling -------------------------------------
   A shared code is short and guessable, so cap how fast one client
   can try. In-memory per server instance: enough to stop a script,
   and it costs nothing when nobody is attacking. */
type Bucket = { n: number; until: number };
const buckets: Map<string, Bucket> = (globalThis as any).__spgAccessTries || ((globalThis as any).__spgAccessTries = new Map());
const MAX_TRIES = 8;
const WINDOW_MS = 10 * 60 * 1000;

export function throttle(key: string): { ok: boolean; retryInSeconds: number } {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || now > b.until) {
    buckets.set(key, { n: 1, until: now + WINDOW_MS });
    return { ok: true, retryInSeconds: 0 };
  }
  b.n += 1;
  if (b.n > MAX_TRIES) return { ok: false, retryInSeconds: Math.ceil((b.until - now) / 1000) };
  return { ok: true, retryInSeconds: 0 };
}

export function clearThrottle(key: string): void {
  buckets.delete(key);
}
