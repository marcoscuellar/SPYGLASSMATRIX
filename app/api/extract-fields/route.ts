import { NextRequest, NextResponse } from 'next/server';
import { complete } from '@/lib/anthropic';
import { buildExtractPrompt, parseFields } from '@/lib/prompts';

export const runtime = 'nodejs';

// POST /api/extract-fields
// Body: { text }. Returns { fields } — extracted engagement fields, or {}
// when nothing could be parsed / no LLM key is configured.
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
  const fields = raw ? parseFields(raw) : {};

  return NextResponse.json({ fields });
}
