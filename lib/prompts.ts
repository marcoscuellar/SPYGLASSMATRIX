/* ============================================================
   Spyglass Matrix — prompt construction + JSON parsing
   Ported from the prototype. Runs server-side only (the JD +
   private notes are confidential and never reach the browser).
   ============================================================ */

import type { BuilderPayload, ExtractedFields, Matrix } from './types';

export const EMP_TYPES = ['Full time — Direct hire', 'Full time — Contract', 'Temp', 'Payrolling'];
export const LOCATIONS = ['Remote', 'Onsite', 'Hybrid'];

export function fmtDate(d: string): string {
  if (!d) return '';
  try {
    const dt = new Date(d + 'T00:00:00');
    return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return d;
  }
}

export function buildPrompt({ role, client, date, empType, salary, location, jd, notes }: BuilderPayload): string {
  const roleLabel = (role && role.trim()) || 'the role described';
  const clientLabel = (client && client.trim()) || 'the client';
  return [
    'You are Spyglass, an AI that turns a recruiter\'s job description and private client-meeting notes into a structured hiring "Matrix" for ' + roleLabel + ' at ' + clientLabel + '.',
    'ENGAGEMENT: ' + (empType || 'unspecified') + (location ? ' · ' + location : '') + (salary ? ' · ' + salary : '') + (date ? ' · opened ' + date : '') + '. (Type, location, and comp should shape the target titles, boolean, and watch-outs.)',
    '',
    'JOB DESCRIPTION:',
    (jd && jd.trim()) || '(none provided)',
    '',
    'PRIVATE MEETING NOTES (the real, above-the-JD context — confidential, never shown to candidates):',
    (notes && notes.trim()) || '(none provided)',
    '',
    'Return STRICT minified JSON, exactly these keys, no markdown fences, no commentary:',
    '{"jd":{"title":"the role title","summary":"one sentence from the JD","summary2":"one sentence on seniority/context","mustHave":["3-4 short bullets"],"niceToHave":["2-3 short bullets"]},"lookFor":[{"signal":"2-4 word name","detail":"one sentence drawn from the NOTES"}],"questions":[{"q":"a candidate-safe interview question","surfaces":"what it reveals, 3-6 words","internal":"confidential why-we-ask guidance from the notes"}],"targetTitles":["3 job titles to source from"],"boolean":"a LinkedIn boolean search string","watchOuts":[{"flag":"2-4 word risk","note":"one sentence from the notes"}]}',
    '',
    'Rules: lookFor has 3 items; questions has 4 items; watchOuts has 2 items. Keep every string short. lookFor, each question\'s "internal" field, and watchOuts MUST be derived from the private notes (not the JD). Return ONLY the JSON.',
  ].join('\n');
}

function stripFences(raw: string): string {
  return String(raw).trim().replace(/^```[a-z]*/i, '').replace(/```$/, '').trim();
}

export function parseMatrix(raw: string, payload: BuilderPayload): Matrix | null {
  try {
    const t = stripFences(raw);
    const a = t.indexOf('{'), b = t.lastIndexOf('}');
    if (a < 0 || b < 0) return null;
    const o = JSON.parse(t.slice(a, b + 1));
    if (!Array.isArray(o.lookFor) || !Array.isArray(o.questions)) return null;
    const j = o.jd || {};
    return {
      client: (payload.client && payload.client.trim()) || '',
      date: fmtDate(payload.date),
      empType: (payload.empType || '').trim(),
      salary: (payload.salary || '').trim(),
      location: (payload.location || '').trim(),
      jd: {
        title: (payload.role && payload.role.trim()) || j.title || 'Open role',
        fullText: (payload.jd || '').trim(),
        summary: j.summary || '',
        summary2: j.summary2 || '',
        mustHave: Array.isArray(j.mustHave) ? j.mustHave : [],
        niceToHave: Array.isArray(j.niceToHave) ? j.niceToHave : [],
      },
      lookFor: o.lookFor.map((x: any) => ({ signal: x.signal || '', detail: x.detail || '' })),
      questions: o.questions.map((x: any) => ({ q: x.q || '', surfaces: x.surfaces || '', internal: x.internal || '' })),
      targetTitles: Array.isArray(o.targetTitles) ? o.targetTitles : [],
      boolean: o.boolean || '',
      watchOuts: Array.isArray(o.watchOuts) ? o.watchOuts.map((x: any) => ({ flag: x.flag || '', note: x.note || '' })) : [],
    };
  } catch {
    return null;
  }
}

export function buildExtractPrompt(text: string): string {
  return (
    'From this recruiting job description and meeting notes, extract these fields as STRICT minified JSON ' +
    '(use an empty string for anything not stated). Keys: "role","client","date" (YYYY-MM-DD or ""),' +
    '"empType" (one of: ' + EMP_TYPES.join(' | ') + '),"salary","location" (one of: Remote | Onsite | Hybrid).\n\n' +
    'TEXT:\n' + text + '\n\nReturn ONLY the JSON.'
  );
}

export function parseFields(raw: string): ExtractedFields {
  try {
    const s = stripFences(raw);
    const a = s.indexOf('{'), b = s.lastIndexOf('}');
    if (a < 0 || b < 0) return {};
    const o = JSON.parse(s.slice(a, b + 1));
    const out: ExtractedFields = {};
    if (o.role) out.role = String(o.role);
    if (o.client) out.client = String(o.client);
    if (o.date) out.date = String(o.date);
    if (o.salary) out.salary = String(o.salary);
    const norm = (s: string) => s.toLowerCase().replace(/[^a-z]/g, '');
    const me = EMP_TYPES.find((x) => norm(x) === norm(String(o.empType || '')));
    if (me) out.empType = me;
    const ml = LOCATIONS.find((x) => x.toLowerCase() === String(o.location || '').toLowerCase());
    if (ml) out.location = ml;
    return out;
  } catch {
    return {};
  }
}
