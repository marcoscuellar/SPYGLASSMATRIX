import { NextResponse } from 'next/server';
import { clearPassCookie } from '@/lib/access';

export const dynamic = 'force-dynamic';

export async function POST() {
  const res = NextResponse.json({ ok: true });
  const c = clearPassCookie();
  res.cookies.set(c.name, c.value, c.options);
  return res;
}
