import { NextRequest, NextResponse } from 'next/server';
import { complete } from '@/lib/anthropic';
import { buildPrompt, parseMatrix } from '@/lib/prompts';
import type { BuilderPayload } from '@/lib/types';

export const runtime = 'nodejs';

// POST /api/generate-matrix
// Body: BuilderPayload. Returns { matrix } on success, or { matrix: null }
// when no LLM key is configured / the call fails — the client then falls
// back to the bundled sample Matrix.
export async function POST(req: NextRequest) {
  let payload: BuilderPayload;
  try {
    payload = (await req.json()) as BuilderPayload;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!payload?.jd?.trim() || !payload?.notes?.trim()) {
    return NextResponse.json({ error: 'Job description and notes are required.' }, { status: 422 });
  }

  const raw = await complete(buildPrompt(payload));
  const matrix = raw ? parseMatrix(raw, payload) : null;

  return NextResponse.json({ matrix });
}
