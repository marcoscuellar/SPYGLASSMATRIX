import { NextRequest, NextResponse } from 'next/server';
import { addCandidate, listCandidates } from '@/lib/store';
import type { ScoreKey, StoredCandidateInput } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SCORES: ScoreKey[] = ['strong', 'solid', 'partial', 'gap'];

export async function GET() {
  const candidates = await listCandidates();
  return NextResponse.json({ candidates });
}

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const name = String(body?.name || '').trim();
  if (!name) return NextResponse.json({ error: 'Name is required.' }, { status: 422 });

  const toNum = (v: any): number | null => {
    if (v === '' || v == null) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };
  const toArr = (v: any): string[] => Array.isArray(v) ? v.map(String) : String(v || '').split('\n').map((s) => s.trim()).filter(Boolean);

  const input: StoredCandidateInput = {
    name,
    role: String(body?.role || '').trim(),
    company: String(body?.company || '').trim(),
    years: toNum(body?.years),
    location: String(body?.location || '').trim(),
    compExp: String(body?.compExp || '').trim(),
    avail: String(body?.avail || '').trim(),
    tags: (Array.isArray(body?.tags) ? body.tags : String(body?.tags || '').split(',')).map((s: string) => String(s).trim()).filter(Boolean),
    fit: toNum(body?.fit),
    headline: String(body?.headline || '').trim(),
    intro: String(body?.intro || '').trim(),
    fitBullets: toArr(body?.fitBullets),
    cta: String(body?.cta || '').trim(),
    signals: Array.isArray(body?.signals)
      ? body.signals
          .filter((s: any) => s && String(s.signal || '').trim())
          .map((s: any) => ({ signal: String(s.signal).trim(), score: (SCORES.includes(s.score) ? s.score : 'solid') as ScoreKey }))
      : [],
    experience: Array.isArray(body?.experience)
      ? body.experience
          .filter((e: any) => e && (String(e.company || '').trim() || String(e.title || '').trim()))
          .map((e: any) => ({
            company: String(e.company || '').trim(),
            title: String(e.title || '').trim(),
            period: String(e.period || '').trim(),
            location: String(e.location || '').trim(),
            points: toArr(e.points),
          }))
      : [],
  };

  const candidate = await addCandidate(input);
  return NextResponse.json({ candidate });
}
