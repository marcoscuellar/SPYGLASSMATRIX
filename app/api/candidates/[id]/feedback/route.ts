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
  const decision = body?.decision as Decision;
  if (!DECISIONS.includes(decision)) {
    return NextResponse.json({ error: 'decision must be advance | hold | pass' }, { status: 422 });
  }
  await setFeedback(params.id, decision, String(body?.note || ''));
  return NextResponse.json({ ok: true });
}
