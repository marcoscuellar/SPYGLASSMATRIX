#!/usr/bin/env node
/* Generates scripts/seed-portal.console.js — a self-contained snippet you paste
   into the browser DevTools console while on the live site. It reuses the exact
   SETTINGS + CANDIDATES from seed-portal.mjs, so the two can never drift.
   Run: node scripts/gen-console-seed.mjs */
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { SETTINGS, CANDIDATES } from './seed-portal.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, 'seed-portal.console.js');

const body = `/* ============================================================
   Spyglass Matrix — portal seed (browser-console version)

   HOW TO USE
   1. Open your live site in the browser:  https://spyglassmatrix.vercel.app
   2. Open DevTools > Console  (F12, or Cmd/Ctrl+Shift+J).
   3. Paste this whole file, press Enter, watch the log.
   4. Reload /portal — the Northwind Cloud tech shortlist is now live.

   It runs on the site's own origin, so it writes straight to that site's
   database via the existing /api/settings and /api/candidates routes.
   Idempotent: clears whatever is there first, then adds exactly these three.
   ============================================================ */
(async () => {
  const SETTINGS = ${JSON.stringify(SETTINGS, null, 2)};
  const CANDIDATES = ${JSON.stringify(CANDIDATES, null, 2)};

  const api = async (method, path, body) => {
    const res = await fetch(path, {
      method,
      headers: body ? { 'content-type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    if (!res.ok) throw new Error(method + ' ' + path + ' -> ' + res.status + ' ' + text.slice(0, 200));
    return text ? JSON.parse(text) : {};
  };

  console.log('%cSpyglass — seeding portal on ' + location.origin, 'font-weight:bold');
  const s = await api('POST', '/api/settings', SETTINGS);
  console.log('Prepared for:', s.settings.clientName, '—', s.settings.roleLabel);

  const { candidates: existing } = await api('GET', '/api/candidates');
  for (const c of existing) { await api('DELETE', '/api/candidates/' + c.id); console.log('Removed:', c.name || c.id); }
  if (!existing.length) console.log('(no existing candidates to remove)');

  for (const c of CANDIDATES) { const { candidate } = await api('POST', '/api/candidates', c); console.log('Added:', candidate.name, '(fit ' + candidate.fit + ')'); }

  const { candidates: final } = await api('GET', '/api/candidates');
  console.log('%cDone — portal now shows ' + final.length + ' candidate(s). Reload /portal to see them.', 'color:green;font-weight:bold');
})().catch((e) => console.error('Seed failed:', e.message || e));
`;

writeFileSync(out, body);
console.log('Wrote', out, `(${body.length} bytes)`);
