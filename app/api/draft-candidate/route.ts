import { NextRequest, NextResponse } from 'next/server';
import { complete, hasApiKey } from '@/lib/anthropic';
import { buildCandidatePrompt, parseCandidate } from '@/lib/prompts';

export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

// POST /api/draft-candidate  { text, brief? }
// Turns a résumé into a client-facing candidate write-up the admin form
// can pre-fill. Requires ANTHROPIC_API_KEY (this is a generative step).
export async function POST(req: NextRequest) {
  let text = '';
  let brief = '';
  try {
    const body = await req.json();
    text = String(body?.text || '');
    brief = String(body?.brief || '');
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!text.trim()) {
    return NextResponse.json({ error: 'No résumé text provided.' }, { status: 422 });
  }
  if (!hasApiKey()) {
    return NextResponse.json({ error: 'AI write-up needs an ANTHROPIC_API_KEY. You can still fill the form by hand.' }, { status: 503 });
  }

  const raw = await complete(buildCandidatePrompt(text, brief), 1200);
  const candidate = raw ? parseCandidate(raw) : null;
  if (!candidate) {
    return NextResponse.json({ error: 'Could not draft from this résumé. Try again or fill the form by hand.' }, { status: 502 });
  }
  return NextResponse.json({ candidate });
}
