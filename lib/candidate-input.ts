/* ============================================================
   Shared coercion for candidate writes.
   Lives outside the route files because a Next.js route module may
   only export its handlers — POST (create) and PUT (edit) both
   import from here so the two paths coerce identically.
   ============================================================ */
import type { ScoreKey, StoredCandidateInput } from './types';

const SCORES: ScoreKey[] = ['strong', 'solid', 'partial', 'gap'];

const toNum = (v: any): number | null => {
  if (v === '' || v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};
const toArr = (v: any): string[] =>
  Array.isArray(v) ? v.map(String).map((s) => s.trim()).filter(Boolean)
                   : String(v || '').split('\n').map((s) => s.trim()).filter(Boolean);

export function parseCandidateInput(body: any): StoredCandidateInput {
  return {
    name: String(body?.name || '').trim(),
    role: String(body?.role || '').trim(),
    company: String(body?.company || '').trim(),
    years: toNum(body?.years),
    location: String(body?.location || '').trim(),
    compExp: String(body?.compExp || '').trim(),
    avail: String(body?.avail || '').trim(),
    workAuth: String(body?.workAuth || '').trim(),
    tags: (Array.isArray(body?.tags) ? body.tags : String(body?.tags || '').split(','))
      .map((s: string) => String(s).trim()).filter(Boolean),
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
    resumeUrl: String(body?.resumeUrl || '').trim(),
  };
}
