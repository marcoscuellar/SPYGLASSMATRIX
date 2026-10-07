import { NextRequest, NextResponse } from 'next/server';
import { complete } from '@/lib/anthropic';
import { buildPrompt, parseMatrix } from '@/lib/prompts';
import { createMatrix } from '@/lib/store';
import type { BuilderPayload } from '@/lib/types';

export const runtime = 'nodejs';

// POST /api/generate-matrix
// Body: BuilderPayload. Returns { matrix, id } on success, or { matrix: null,
// id: null } when no LLM key is configured / the call fails — the client then
// falls back to the bundled sample Matrix.
//
// A generated Matrix is filed in the store so it becomes a real search the
// workroom can open. The sample fallback is deliberately NOT filed: it is
// demo content and would clutter the deck with a role nobody is working.
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
  if (!matrix) return NextResponse.json({ matrix: null, id: null });

  // Filing must not cost the recruiter the Matrix they just waited for: if the
  // write fails, still hand back the Matrix and let the client show it unsaved.
  let id: string | null = null;
  try {
    id = (await createMatrix(matrix)).id;
  } catch (e) {
    console.error('[generate-matrix] could not file the matrix:', e);
  }

  return NextResponse.json({ matrix, id });
}
