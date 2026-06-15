/* ============================================================
   Spyglass Matrix — client-portal storage
   Persists the candidates the recruiter adds so the client can
   see them on their own device. Uses Postgres when POSTGRES_URL
   is configured (provision Vercel Postgres / Neon in one click);
   otherwise falls back to an in-memory store so the app still
   runs locally. NOTE: the in-memory store does NOT persist across
   serverless instances — set up Postgres for the real hand-off.
   ============================================================ */

import { sql } from '@vercel/postgres';
import type { Decision, StoredCandidate, StoredCandidateInput } from './types';

const hasDb = !!(process.env.POSTGRES_URL || process.env.POSTGRES_URL_NON_POOLING);

export function isPersistent(): boolean {
  return hasDb;
}

// ---- In-memory fallback (per server instance) ----------------
const mem: Map<string, StoredCandidate> = (globalThis as any).__spgMem || ((globalThis as any).__spgMem = new Map());

function newId(): string {
  return 'c_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

function rowToCandidate(id: string, createdAt: string, data: any, decision: string | null, note: string | null): StoredCandidate {
  return {
    id,
    createdAt,
    name: data.name || '',
    role: data.role || '',
    company: data.company || '',
    years: data.years ?? null,
    location: data.location || '',
    compExp: data.compExp || '',
    avail: data.avail || '',
    tags: Array.isArray(data.tags) ? data.tags : [],
    fit: data.fit ?? null,
    headline: data.headline || '',
    intro: data.intro || '',
    fitBullets: Array.isArray(data.fitBullets) ? data.fitBullets : [],
    cta: data.cta || '',
    signals: Array.isArray(data.signals) ? data.signals : [],
    decision: (decision as Decision) || null,
    note: note || null,
  };
}

let schemaReady = false;
async function ensureSchema() {
  if (!hasDb || schemaReady) return;
  await sql`CREATE TABLE IF NOT EXISTS portal_candidates (
    id          TEXT PRIMARY KEY,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    data        JSONB NOT NULL,
    decision    TEXT,
    note        TEXT
  )`;
  schemaReady = true;
}

export async function listCandidates(): Promise<StoredCandidate[]> {
  if (!hasDb) {
    return [...mem.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }
  await ensureSchema();
  const { rows } = await sql`SELECT id, created_at, data, decision, note FROM portal_candidates ORDER BY created_at ASC`;
  return rows.map((r: any) => rowToCandidate(r.id, new Date(r.created_at).toISOString(), r.data, r.decision, r.note));
}

export async function getCandidate(id: string): Promise<StoredCandidate | null> {
  if (!hasDb) return mem.get(id) || null;
  await ensureSchema();
  const { rows } = await sql`SELECT id, created_at, data, decision, note FROM portal_candidates WHERE id = ${id}`;
  if (!rows.length) return null;
  const r: any = rows[0];
  return rowToCandidate(r.id, new Date(r.created_at).toISOString(), r.data, r.decision, r.note);
}

export async function addCandidate(input: StoredCandidateInput): Promise<StoredCandidate> {
  const id = newId();
  const createdAt = new Date().toISOString();
  const data = { ...input };
  if (!hasDb) {
    const cand: StoredCandidate = { id, createdAt, ...input, decision: null, note: null };
    mem.set(id, cand);
    return cand;
  }
  await ensureSchema();
  await sql`INSERT INTO portal_candidates (id, created_at, data) VALUES (${id}, ${createdAt}, ${JSON.stringify(data)}::jsonb)`;
  return { id, createdAt, ...input, decision: null, note: null };
}

export async function deleteCandidate(id: string): Promise<void> {
  if (!hasDb) { mem.delete(id); return; }
  await ensureSchema();
  await sql`DELETE FROM portal_candidates WHERE id = ${id}`;
}

export async function setFeedback(id: string, decision: Decision, note: string): Promise<void> {
  if (!hasDb) {
    const c = mem.get(id);
    if (c) { c.decision = decision; c.note = note; }
    return;
  }
  await ensureSchema();
  await sql`UPDATE portal_candidates SET decision = ${decision}, note = ${note} WHERE id = ${id}`;
}
