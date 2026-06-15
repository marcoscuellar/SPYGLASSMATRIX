# Spyglass Matrix

An internal tool for a recruiting/staffing firm. A recruiter submits a job
description plus their raw client-meeting notes; an AI generates a structured
hiring **Matrix** (search strategy + role-specific screening questions), which
is then **forked** into a full internal *Recruiter* copy and a sanitized
*Candidate-safe* copy. The recruiter submits the shortlist to a **Client
Portal**, where the client opens candidate dossiers, sends a decision, and
closes the search.

This is a production recreation of the high-fidelity design handoff, built with
**Next.js (App Router) + TypeScript**.

## The connected flow

```
builder → building → matrix → submitting → client
```

1. **Matrix Builder** — the intake screen. Recruiter drops in the JD + private
   meeting notes; engagement fields auto-fill from the brief.
2. **The Matrix** — the generated strategy document, with a Recruiter ⇄
   Candidate toggle. Internal sections (*What to look for*, *Search &
   watch-outs*, and each question's *why we ask*) are **removed from the DOM**
   in the candidate copy, not merely hidden. Printable (`@media print`).
3. **Submit transition** — seals the internal notes and packages the
   candidate-safe dossiers.
4. **Client Portal** — editorial shortlist → expanded dossier with an AI
   candidate brief + feedback panel → placement.

## Getting started

```bash
npm install
npm run dev          # http://localhost:3000
```

```bash
npm run build && npm start   # production build
```

No external services are required to run or demo the app — see below.

## AI generation (server-side)

The Builder calls two Next.js API routes that talk to the Anthropic API
**server-side**, so the confidential JD + meeting notes and the API key never
reach the browser:

- `POST /api/generate-matrix` — builds the full Matrix from the brief.
- `POST /api/extract-fields` — extracts the engagement fields (role, client,
  date, type, salary, location) from the brief text.

Configure a key to enable live generation (copy `.env.example` → `.env.local`):

```
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-sonnet-4-6   # optional; claude-opus-4-8 for the most capable
```

**Graceful fallback:** when `ANTHROPIC_API_KEY` is unset (or a call fails), the
routes return no result and the app renders the bundled **static sample
Matrix** (`lib/data.ts`). The full flow works end-to-end with zero
configuration — useful for demos and design review.

> The candidate fit scores and per-signal grades in the client shortlist are
> static sample data, as in the handoff. A real scoring step is a future
> addition.

## Project structure

```
app/
  layout.tsx                 fonts (Geist / Geist Mono / Newsreader), metadata
  page.tsx                   mounts the Flow
  globals.css                design tokens + base + flow styles
  api/generate-matrix/route.ts
  api/extract-fields/route.ts
components/
  Flow.tsx                   stage machine (builder→…→client) + MatrixStage
  BuilderStage.tsx           intake screen
  MatrixView.tsx             the forked Matrix document
  Dossier.tsx                dossier body, meta, AI candidate brief, signal map
  Client.tsx                 portal, expanded dossier + feedback, placement
  Overlays.tsx               build / submit progress bridges
  FlowContext.tsx            client-portal shared state
  ui.tsx                     primitives (Mark, Button, Card, Tag, Avatar, …)
  icons.tsx                  inline SVG icons (no external assets)
lib/
  data.ts                    sample Matrix + candidate shortlist + score meta
  prompts.ts                 prompt construction + JSON parsing (server-side)
  anthropic.ts               server-side Anthropic call (key from env)
  types.ts                   shared types
```

## Design fidelity

- **Tokens** are ported from the handoff's `brand/tokens.css`, merged with the
  connected-flow re-skin (navy + black + white; gold kept strictly as a jewel
  accent for CTAs, ticks, and success dots) — see `app/globals.css`.
- **Type:** Geist (UI) + Geist Mono (labels/eyebrows) + Newsreader italic for
  the editorial accent word, loaded from Google Fonts.
- **The cufflink mark** is a single inline SVG, recolored per variant.
- Easing `cubic-bezier(0.16, 1, 0.3, 1)`; cards lift on hover; pulse/animation
  respects `prefers-reduced-motion`.

### Intentionally not reproduced

Per the handoff, the prototype-only **browser-frame chrome** and the **Tweaks
panel** are omitted. The Tweaks defaults are baked in: Bold heading weight,
gold serif (Newsreader italic) accent word, Light card theme.
