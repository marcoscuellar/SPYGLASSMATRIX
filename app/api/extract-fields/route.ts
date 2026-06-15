import { NextRequest, NextResponse } from 'next/server';
import { complete } from '@/lib/anthropic';
import { buildExtractPrompt, parseFields } from '@/lib/prompts';
import { heuristicFields } from '@/lib/extract';
import type { ExtractedFields } from '@/lib/types';

export const runtime = 'nodejs';

// POST /api/extract-fields
// Body: { text }. Returns { fields } — engagement fields extracted from the
// brief. Tries the LLM first; falls back to a no-key heuristic parser so the
// engagement still pre-populates without an ANTHROPIC_API_KEY configured.
export async function POST(req: NextRequest) {
  let text = '';
  try {
    const body = await req.json();
    text = String(body?.text || '');
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!text.trim()) {
    return NextResponse.json({ fields: {} });
  }

  const raw = await complete(buildExtractPrompt(text), 400);
  const ai: ExtractedFields = raw ? parseFields(raw) : {};

  // Merge: AI values win; heuristics fill any gaps the AI left (or everything
  // when no key is set).
  const heur = heuristicFields(text);
  const fields: ExtractedFields = { ...heur, ...ai };

  return NextResponse.json({ fields });
}
