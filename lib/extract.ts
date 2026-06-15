/* ============================================================
   Spyglass Matrix — heuristic field extraction (no LLM)
   A best-effort fallback so uploading a JD still pre-populates
   the engagement fields when no ANTHROPIC_API_KEY is configured.
   The AI extractor (lib/prompts.ts) is preferred when available.
   ============================================================ */

import type { ExtractedFields } from './types';
import { EMP_TYPES, LOCATIONS } from './prompts';

function firstNonEmptyLine(text: string): string {
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (line && line.length <= 80) return line;
  }
  return '';
}

function matchLabel(text: string, labels: string[]): string {
  for (const label of labels) {
    const re = new RegExp(`^\\s*${label}\\s*[:\\-–]\\s*(.+)$`, 'im');
    const m = text.match(re);
    if (m && m[1]) return m[1].trim();
  }
  return '';
}

export function heuristicFields(text: string): ExtractedFields {
  const out: ExtractedFields = {};
  if (!text || !text.trim()) return out;

  // Role / title
  const role = matchLabel(text, ['role', 'job title', 'title', 'position']) || firstNonEmptyLine(text);
  if (role) out.role = role.slice(0, 80);

  // Client / company
  const client = matchLabel(text, ['client', 'company', 'employer', 'firm']);
  if (client) out.client = client.slice(0, 80);
  else {
    const at = text.match(/\b(?:at|for)\s+([A-Z][A-Za-z&.,'’\- ]{2,40}(?:Advisors|Group|Partners|Capital|Wealth|Health|Legal|Industries|LLP|LLC|Inc\.?))/);
    if (at && at[1]) out.client = at[1].trim();
  }

  // Salary / rate — $120k, $120,000, $75/hr, $160–185k
  const salary = text.match(/\$\s?\d[\d,]*(?:\s?[–-]\s?\$?\d[\d,]*)?\s?(?:k|K|\/\s?hr|\/\s?hour|per\s?hour)?/);
  if (salary) out.salary = salary[0].replace(/\s+/g, ' ').trim();

  // Location — Remote / Onsite / Hybrid keyword
  const loc = LOCATIONS.find((l) => new RegExp(`\\b${l}\\b`, 'i').test(text));
  if (loc) out.location = loc;

  // Engagement type
  const lower = text.toLowerCase();
  if (/\bpayroll/.test(lower)) out.empType = 'Payrolling';
  else if (/\btemp(orary)?\b/.test(lower)) out.empType = 'Temp';
  else if (/\bcontract\b/.test(lower)) out.empType = 'Full time — Contract';
  else if (/\b(full[\s-]?time|direct hire|permanent)\b/.test(lower)) out.empType = 'Full time — Direct hire';

  // Date — YYYY-MM-DD if explicitly present
  const date = text.match(/\b(20\d{2})-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])\b/);
  if (date) out.date = date[0];

  // Normalize against allowed option lists
  if (out.empType && !EMP_TYPES.includes(out.empType)) delete out.empType;
  return out;
}
