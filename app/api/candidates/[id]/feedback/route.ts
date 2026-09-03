import { NextRequest, NextResponse } from 'next/server';
import { setFeedback } from '@/lib/store';
import type { Decision } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DECISIONS: Decision[] = ['advance', 'hold', 'pass'];

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // The client's notepad saves on its own; a decision is optional. Anything
  // that is neither a valid decision nor absent is still rejected.
  const raw = body?.decision;
  const decision: Decision | null = raw == null || raw === '' ? null : (raw as Decision);
  if (decision !== null && !DECISIONS.includes(decision)) {
    return NextResponse.json({ error: 'decision must be advance | hold | pass' }, { status: 422 });
  }

  // `clear: true` takes the candidate back to undecided.
  const clear = body?.clear === true;
  await setFeedback(params.id, decision, String(body?.note || '').slice(0, 20000), clear);
  return NextResponse.json({ ok: true });
}
