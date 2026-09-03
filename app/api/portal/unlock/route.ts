import { NextResponse } from 'next/server';
import { checkPortalCode, portalPassCookie, portalGateOn } from '@/lib/portal-access';
import { throttle, clearThrottle } from '@/lib/access';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  if (!portalGateOn()) return NextResponse.json({ ok: true });

  const body = await req.json().catch(() => ({}));
  const code = String((body as any)?.code || '');

  // Same throttle the workroom uses: a shared code is short, so the only real
  // defence against guessing it is limiting how fast anyone can try.
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
  const gate = throttle(ip);
  if (!gate.ok) {
    return NextResponse.json(
      { error: `Too many attempts. Try again in ${Math.ceil(gate.retryInSeconds / 60)} minute(s).` },
      { status: 429 },
    );
  }

  if (!checkPortalCode(code)) {
    return NextResponse.json({ error: 'That code is not recognised.' }, { status: 401 });
  }

  clearThrottle(ip);
  const res = NextResponse.json({ ok: true });
  const c = portalPassCookie();
  res.cookies.set(c.name, c.value, c.options);
  return res;
}
