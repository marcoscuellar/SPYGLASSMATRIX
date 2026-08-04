import { NextResponse } from 'next/server';
import { listUsers, createUser } from '@/lib/store';
import { getSession, generateTempPassword, hashPassword } from '@/lib/auth';
import type { Role } from '@/lib/types';

export const dynamic = 'force-dynamic';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function GET() {
  const s = getSession();
  if (!s || s.role !== 'admin') return NextResponse.json({ error: 'Admins only.' }, { status: 403 });
  return NextResponse.json({ users: await listUsers() });
}

export async function POST(req: Request) {
  const s = getSession();
  if (!s || s.role !== 'admin') return NextResponse.json({ error: 'Admins only.' }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const name = String(body?.name || '').trim();
  const email = String(body?.email || '').trim().toLowerCase();
  const role: Role = body?.role === 'admin' ? 'admin' : 'member';
  if (!name) return NextResponse.json({ error: 'Add their name.' }, { status: 400 });
  if (!EMAIL_RE.test(email)) return NextResponse.json({ error: 'Enter a valid email.' }, { status: 400 });

  const tempPassword = generateTempPassword();
  try {
    const user = await createUser({ email, name, role, passwordHash: hashPassword(tempPassword), mustReset: true });
    const origin = new URL(req.url).origin;
    return NextResponse.json({ user, tempPassword, loginUrl: `${origin}/login` });
  } catch (e: any) {
    if (e?.message === 'EMAIL_TAKEN') return NextResponse.json({ error: 'That email already has an account.' }, { status: 409 });
    return NextResponse.json({ error: 'Could not create the account.' }, { status: 500 });
  }
}
