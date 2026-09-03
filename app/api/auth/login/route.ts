import { NextResponse } from 'next/server';
import { getUserByEmail } from '@/lib/store';
import { verifyPassword, sessionCookieValue, authReady } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  // Fail closed rather than hand out sessions signed with a secret that is in
  // the source tree. Says what to fix without confirming any account exists.
  if (!authReady()) {
    return NextResponse.json(
      { error: 'Sign-in is disabled until AUTH_SECRET is set on this deployment.' },
      { status: 503 },
    );
  }
  const body = await req.json().catch(() => ({}));
  const email = String(body?.email || '').trim();
  const password = String(body?.password || '');
  if (!email || !password) {
    return NextResponse.json({ error: 'Enter your email and password.' }, { status: 400 });
  }
  const user = await getUserByEmail(email);
  // Same message either way so we don't reveal which emails exist.
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return NextResponse.json({ error: 'Wrong email or password.' }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true, mustReset: user.mustReset, role: user.role, name: user.name });
  const c = sessionCookieValue({ uid: user.id, email: user.email, name: user.name, role: user.role });
  res.cookies.set(c.name, c.value, c.options);
  return res;
}
