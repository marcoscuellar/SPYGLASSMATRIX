#!/usr/bin/env node
/* ============================================================
   Spyglass Matrix — portal seed (manual / CI runner)

   NOTE: the app now seeds itself on first run (see lib/store.ts +
   lib/portal-seed.json), so a normal deploy needs nothing here. This script
   stays as a manual override — e.g. to force a re-seed against a running
   instance, or from CI — by driving the same public API routes:

     POST   /api/settings           set "prepared for" client + role
     GET    /api/candidates         read current shortlist
     DELETE /api/candidates/:id     remove each existing candidate
     POST   /api/candidates         add each seed candidate

   The candidate data is read from the single source of truth,
   lib/portal-seed.json, so it can never drift from what the app seeds.

   Usage:
     node scripts/seed-portal.mjs                       # -> http://localhost:3000
     node scripts/seed-portal.mjs https://your-app.app  # -> live site
     BASE_URL=https://your-app.app node scripts/seed-portal.mjs
     node scripts/seed-portal.mjs --dry-run             # print, don't write
   ============================================================ */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const seed = JSON.parse(readFileSync(join(HERE, '..', 'lib', 'portal-seed.json'), 'utf8'));

export const SETTINGS = seed.settings;
export const CANDIDATES = seed.candidates; // each includes a stable `id`; the API ignores it and assigns its own

const BASE_URL = (process.argv.find((a) => /^https?:\/\//.test(a)) || process.env.BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
const DRY_RUN = process.argv.includes('--dry-run');

// ---- Tiny fetch helpers --------------------------------------
async function api(method, path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: body ? { 'content-type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json;
  try { json = text ? JSON.parse(text) : {}; } catch { json = { raw: text }; }
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status} ${res.statusText}: ${text.slice(0, 300)}`);
  return json;
}

async function main() {
  console.log(`\nSpyglass Matrix — portal seed`);
  console.log(`Target: ${BASE_URL}${DRY_RUN ? '  (DRY RUN — no writes)' : ''}\n`);

  if (DRY_RUN) {
    console.log('Would set "Prepared for":', SETTINGS);
    console.log(`Would replace existing candidates with ${CANDIDATES.length}:`);
    for (const c of CANDIDATES) console.log(`  • ${c.name} — ${c.role} (fit ${c.fit})`);
    console.log('\nRe-run without --dry-run to apply.\n');
    return;
  }

  // 1) Personalize the portal header.
  const { settings } = await api('POST', '/api/settings', SETTINGS);
  console.log(`✓ Prepared for: ${settings.clientName} — ${settings.roleLabel}`);

  // 2) Clear whatever is currently in the portal (the old ProCare shortlist).
  const { candidates: existing } = await api('GET', '/api/candidates');
  for (const c of existing) {
    await api('DELETE', `/api/candidates/${c.id}`);
    console.log(`✗ Removed: ${c.name || c.id}`);
  }
  if (!existing.length) console.log('  (no existing candidates to remove)');

  // 3) Add the seed candidates.
  for (const c of CANDIDATES) {
    const { candidate } = await api('POST', '/api/candidates', c);
    console.log(`✓ Added: ${candidate.name} — ${candidate.role} (fit ${candidate.fit})  [${candidate.id}]`);
  }

  // 4) Verify.
  const { candidates: final } = await api('GET', '/api/candidates');
  console.log(`\nDone. Portal now shows ${final.length} candidate(s). Open ${BASE_URL}/portal to review.\n`);
}

// Only run when invoked directly (e.g. `node scripts/seed-portal.mjs`), not on import.
const invokedDirectly = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (invokedDirectly) {
  main().catch((err) => {
    console.error('\nSeed failed:', err.message);
    console.error(`(Is the target reachable at ${BASE_URL}? For local, run "npm run dev" first.)\n`);
    process.exit(1);
  });
}
