import { NextResponse } from 'next/server';
import { getBoardNotes, setBoardNote } from '@/lib/store';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const s = getSession();
  if (!s) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });
  return NextResponse.json({ notes: await getBoardNotes() });
}

export async function POST(req: Request) {
  const s = getSession();
  if (!s) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const key = String(body?.key || '').trim();
  const note = String(body?.note || '');
  if (!key) return NextResponse.json({ error: 'Missing key.' }, { status: 400 });
  const saved = await setBoardNote(key, note, s.name);
  return NextResponse.json({ ok: true, saved });
}
