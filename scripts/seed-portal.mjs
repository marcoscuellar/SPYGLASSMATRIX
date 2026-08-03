#!/usr/bin/env node
/* ============================================================
   Spyglass Matrix — portal seed (tech demo)
   Re-seeds the client portal so /portal shows the Northwind Cloud
   Technical Product Manager search instead of the old ProCare HR/tax
   shortlist.

   It drives the same public API routes the app already exposes — no
   direct DB access required — so running it against the live URL
   writes straight to the shared Neon Postgres store:

     POST   /api/settings           set "prepared for" client + role
     GET    /api/candidates         read current shortlist
     DELETE /api/candidates/:id     remove each existing candidate
     POST   /api/candidates         add each new candidate

   Usage:
     node scripts/seed-portal.mjs                       # -> http://localhost:3000
     node scripts/seed-portal.mjs https://your-app.app  # -> live site
     BASE_URL=https://your-app.app node scripts/seed-portal.mjs
     node scripts/seed-portal.mjs --dry-run             # print, don't write

   Idempotent: it clears whatever candidates exist first, so re-running
   it always leaves exactly the three demo candidates below.
   ============================================================ */

const BASE_URL = (process.argv.find((a) => /^https?:\/\//.test(a)) || process.env.BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
const DRY_RUN = process.argv.includes('--dry-run');

// ---- Portal personalization ("Prepared for") -----------------
const SETTINGS = {
  clientName: 'Northwind Cloud',
  roleLabel: 'Technical Product Manager search',
};

// ---- The three tech-demo candidates --------------------------
// Scores for the signal map: 'strong' | 'solid' | 'partial' | 'gap'
// ('gap' rows are hidden from the client view by the portal.)
const CANDIDATES = [
  {
    name: 'Priya Nair',
    role: 'Senior Technical Product Manager',
    company: 'Stripe',
    years: 9,
    location: 'San Francisco, CA · Remote-friendly',
    compExp: '$235–265k + equity',
    avail: '30-day notice',
    fit: 95,
    tags: ['Developer Platform', 'APIs', 'Ex-Engineer', 'Platform Strategy'],
    headline: 'An engineer-turned-PM who ships developer platforms teams actually want to build on.',
    intro:
      'Priya spent six years shipping backend and API infrastructure before moving into product, and it shows in how she works: she writes the interface spec, reviews the SDKs, and sits in the on-call channel. On Stripe’s developer-platform surface she owns the API design review and the public roadmap, translating messy internal capabilities into clean, versioned products that outside engineers adopt without hand-holding. For a Northwind Cloud TPM role that lives at the seam of platform, API, and developer experience, she is as close to a purpose-built fit as this search will surface.',
    fitBullets: [
      'Ex-engineer credibility — six years writing production backend/API code, so she earns technical trust with your platform teams from day one and can arbitrate design trade-offs, not just relay them.',
      'API as a product — owns Stripe’s API design review and versioning/deprecation policy; she treats the interface contract, docs, and SDKs as the product, which is exactly the Northwind Cloud mandate.',
      'Developer-experience obsession — drove a measurable cut in time-to-first-successful-call for new integrators by reworking onboarding, quickstarts, and error messaging.',
      'Roadmap under constraints — has run a public, RFC-driven platform roadmap across competing internal consumers without letting the loudest team win.',
      'Fluent with data-heavy platforms — partnered closely with data/infra teams on usage metering and rate-limiting, so she ramps fast on Northwind’s data-platform surface.',
    ],
    cta: 'Priya is the strongest technical fit on this shortlist — worth an early conversation before her pipeline fills.',
    signals: [
      { signal: 'API product strategy', score: 'strong' },
      { signal: 'Developer experience (DX)', score: 'strong' },
      { signal: 'Engineering depth / ex-engineer', score: 'strong' },
      { signal: 'Platform roadmap & prioritization', score: 'strong' },
      { signal: 'Data-platform fluency', score: 'solid' },
      { signal: 'Executive & GTM stakeholders', score: 'solid' },
    ],
  },
  {
    name: 'Sofia Ramos',
    role: 'Technical Product Manager',
    company: 'Northwind Cloud',
    years: 7,
    location: 'Austin, TX',
    compExp: '$205–230k',
    avail: 'Confidential — internal move (currently at Northwind)',
    fit: 90,
    tags: ['API Products', 'Data Platform', 'Northwind Insider', 'Roadmap'],
    headline: 'Already inside Northwind — owns the API and data-platform surface, and knows exactly where the bodies are buried.',
    intro:
      'Sofia is a rare internal candidate: she’s spent the last two years as a TPM on Northwind Cloud’s data-platform team, shipping the ingestion APIs and the schema-registry work the broader platform now depends on. She knows the systems, the roadmap debts, and the cross-team politics that a external hire would need two quarters to learn. Bringing her into this expanded TPM seat is a low-risk, high-context bet — she can be productive in week one and is already trusted by the engineering leads she’d be partnering with.',
    fitBullets: [
      'Zero ramp on the domain — already owns Northwind’s data-ingestion APIs and schema registry; she starts contributing to roadmap on day one, not day ninety.',
      'API + data platform in one profile — the exact intersection this role sits on, backed by shipped products rather than a pitch.',
      'Trusted internally — the platform engineering leads already know her; she’s built the cross-functional credibility that usually takes an external hire a year to earn.',
      'Roadmap continuity — she can protect and extend the commitments already made to internal consumers instead of resetting them.',
      'Retention signal — promoting into this seat keeps deep institutional knowledge in the building and de-risks the search.',
    ],
    cta: 'Strong internal candidate — handle discreetly; she’s currently at Northwind and this is a confidential move.',
    signals: [
      { signal: 'API product strategy', score: 'strong' },
      { signal: 'Data-platform fluency', score: 'strong' },
      { signal: 'Northwind domain context', score: 'strong' },
      { signal: 'Developer experience (DX)', score: 'solid' },
      { signal: 'Engineering depth', score: 'solid' },
      { signal: 'Roadmap & prioritization', score: 'solid' },
      { signal: 'Executive & GTM stakeholders', score: 'partial' },
    ],
  },
  {
    name: 'Devin Alvarez',
    role: 'Product Manager, Platform / Infrastructure',
    company: 'HashiCorp',
    years: 6,
    location: 'Denver, CO',
    compExp: '$190–210k',
    avail: '2–4 weeks',
    fit: 86,
    tags: ['Platform', 'Infrastructure', 'Reliability', 'Internal Tools'],
    headline: 'A platform/infra PM who’s fluent in the reliability, tooling, and internal-customer work a cloud roadmap runs on.',
    intro:
      'Devin has spent his product career on the unglamorous, load-bearing parts of the stack: internal developer platforms, CI/CD, and the reliability tooling that keeps everything else shipping. At HashiCorp he owns a platform-infrastructure surface with internal engineering teams as his customers, so he’s comfortable prioritizing against SLOs and toil rather than shiny features. He’s a slightly different shape than a pure API-product PM, but for the infrastructure half of the Northwind Cloud mandate he’s a strong, dependable fit worth meeting.',
    fitBullets: [
      'Platform/infra native — owns an internal developer platform end-to-end; he understands the reliability and tooling layer Northwind Cloud is built on.',
      'Reliability-first prioritization — routinely trades features against SLOs, error budgets, and toil reduction in partnership with SRE.',
      'Internal-customer empathy — his users are engineers, so he’s practiced at the developer-experience work this role demands.',
      'Solid API grounding — has shipped internal service APIs, giving him a credible on-ramp to the external API surface.',
      'Pragmatic operator — dependable roadmap execution and clear written comms; a steady complement to a more API-forward hire.',
    ],
    cta: 'A strong platform/infra fit — worth an interview to weigh against the more API-centric candidates.',
    signals: [
      { signal: 'Platform & infrastructure depth', score: 'strong' },
      { signal: 'Reliability / SRE partnership', score: 'strong' },
      { signal: 'Roadmap & prioritization', score: 'solid' },
      { signal: 'Developer experience (DX)', score: 'solid' },
      { signal: 'API product strategy', score: 'solid' },
      { signal: 'Data-platform fluency', score: 'partial' },
    ],
  },
];

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

  // 3) Add the three tech-demo candidates.
  for (const c of CANDIDATES) {
    const { candidate } = await api('POST', '/api/candidates', c);
    console.log(`✓ Added: ${candidate.name} — ${candidate.role} (fit ${candidate.fit})  [${candidate.id}]`);
  }

  // 4) Verify.
  const { candidates: final } = await api('GET', '/api/candidates');
  console.log(`\nDone. Portal now shows ${final.length} candidate(s). Open ${BASE_URL}/portal to review.\n`);
}

main().catch((err) => {
  console.error('\nSeed failed:', err.message);
  console.error(`(Is the target reachable at ${BASE_URL}? For local, run "npm run dev" first.)\n`);
  process.exit(1);
});
