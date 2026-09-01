import { NextResponse } from 'next/server';
import { checkCode, passCookie, throttle, clearThrottle } from '@/lib/access';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const code = String((body as any)?.code || '');

  // Throttle per client so a shared code can't be brute-forced.
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
  const gate = throttle(ip);
  if (!gate.ok) {
    return NextResponse.json(
      { error: `Too many attempts. Try again in ${Math.ceil(gate.retryInSeconds / 60)} minute(s).` },
      { status: 429 },
    );
  }

  if (!checkCode(code)) {
    return NextResponse.json({ error: 'That code is not recognised.' }, { status: 401 });
  }

  clearThrottle(ip);
  const res = NextResponse.json({ ok: true });
  const c = passCookie();
  res.cookies.set(c.name, c.value, c.options);
  return res;
}
