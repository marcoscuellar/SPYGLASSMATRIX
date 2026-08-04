import { NextResponse } from 'next/server';
import { getUserByEmail, updateUserPassword } from '@/lib/store';
import { getSession, verifyPassword, hashPassword, sessionCookieValue } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const currentPassword = String(body?.currentPassword || '');
  const newPassword = String(body?.newPassword || '');
  if (newPassword.length < 8) {
    return NextResponse.json({ error: 'Choose a password of at least 8 characters.' }, { status: 400 });
  }
  const user = await getUserByEmail(session.email);
  if (!user || !verifyPassword(currentPassword, user.passwordHash)) {
    return NextResponse.json({ error: 'Your current password is wrong.' }, { status: 400 });
  }
  await updateUserPassword(user.id, hashPassword(newPassword), false);
  const res = NextResponse.json({ ok: true });
  // Refresh the session cookie (keeps them signed in after the change).
  const c = sessionCookieValue({ uid: user.id, email: user.email, name: user.name, role: user.role });
  res.cookies.set(c.name, c.value, c.options);
  return res;
}
