/* ============================================================
   Spyglass Matrix — client-portal storage
   Persists the candidates the recruiter adds so the client can
   see them on their own device. Uses a Neon (serverless Postgres)
   connection when one is configured; otherwise falls back to an
   in-memory store so the app still runs locally.

   We read the connection string from whichever standard variable
   the database integration sets (POSTGRES_URL, DATABASE_URL, …),
   so it works regardless of how the provider names it.
   ============================================================ */

import { neon } from '@neondatabase/serverless';
import type { Decision, PortalSettings, StoredCandidate, StoredCandidateInput } from './types';

const CONN =
  process.env.POSTGRES_URL ||
  process.env.DATABASE_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.DATABASE_URL_UNPOOLED ||
  process.env.POSTGRES_URL_NON_POOLING ||
  '';

const hasDb = !!CONN;

export function isPersistent(): boolean {
  return hasDb;
}

// Lazily-created Neon HTTP client (one per server instance).
let _sql: ReturnType<typeof neon> | null = null;
function db() {
  if (!_sql) _sql = neon(CONN);
  return _sql;
}

// ---- In-memory fallback (per server instance) ----------------
const mem: Map<string, StoredCandidate> = (globalThis as any).__spgMem || ((globalThis as any).__spgMem = new Map());

function newId(): string {
  return 'c_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

function rowToCandidate(id: string, createdAt: string, data: any, decision: string | null, note: string | null): StoredCandidate {
  const d = typeof data === 'string' ? JSON.parse(data) : (data || {});
  return {
    id,
    createdAt,
    name: d.name || '',
    role: d.role || '',
    company: d.company || '',
    years: d.years ?? null,
    location: d.location || '',
    compExp: d.compExp || '',
    avail: d.avail || '',
    tags: Array.isArray(d.tags) ? d.tags : [],
    fit: d.fit ?? null,
    headline: d.headline || '',
    intro: d.intro || '',
    fitBullets: Array.isArray(d.fitBullets) ? d.fitBullets : [],
    cta: d.cta || '',
    signals: Array.isArray(d.signals) ? d.signals : [],
    decision: (decision as Decision) || null,
    note: note || null,
  };
}

let schemaReady = false;
async function ensureSchema() {
  if (!hasDb || schemaReady) return;
  await db()`CREATE TABLE IF NOT EXISTS portal_candidates (
    id          TEXT PRIMARY KEY,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    data        JSONB NOT NULL,
    decision    TEXT,
    note        TEXT
  )`;
  await db()`CREATE TABLE IF NOT EXISTS portal_settings (
    id    TEXT PRIMARY KEY,
    data  JSONB NOT NULL
  )`;
  schemaReady = true;
}

const DEFAULT_SETTINGS: PortalSettings = { clientName: '', roleLabel: '' };
let memSettings: PortalSettings = (globalThis as any).__spgSettings || ((globalThis as any).__spgSettings = { ...DEFAULT_SETTINGS });

export async function getSettings(): Promise<PortalSettings> {
  if (!hasDb) return { ...DEFAULT_SETTINGS, ...memSettings };
  await ensureSchema();
  const rows = (await db()`SELECT data FROM portal_settings WHERE id = 'default'`) as any[];
  if (!rows.length) return { ...DEFAULT_SETTINGS };
  const d = typeof rows[0].data === 'string' ? JSON.parse(rows[0].data) : rows[0].data;
  return { ...DEFAULT_SETTINGS, ...d };
}

export async function setSettings(s: PortalSettings): Promise<void> {
  const clean: PortalSettings = { clientName: String(s.clientName || ''), roleLabel: String(s.roleLabel || '') };
  if (!hasDb) { memSettings = clean; (globalThis as any).__spgSettings = clean; return; }
  await ensureSchema();
  await db()`INSERT INTO portal_settings (id, data) VALUES ('default', ${JSON.stringify(clean)}::jsonb)
    ON CONFLICT (id) DO UPDATE SET data = ${JSON.stringify(clean)}::jsonb`;
}

export async function listCandidates(): Promise<StoredCandidate[]> {
  if (!hasDb) {
    return [...mem.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }
  await ensureSchema();
  const rows = (await db()`SELECT id, created_at, data, decision, note FROM portal_candidates ORDER BY created_at ASC`) as any[];
  return rows.map((r) => rowToCandidate(r.id, new Date(r.created_at).toISOString(), r.data, r.decision, r.note));
}

export async function getCandidate(id: string): Promise<StoredCandidate | null> {
  if (!hasDb) return mem.get(id) || null;
  await ensureSchema();
  const rows = (await db()`SELECT id, created_at, data, decision, note FROM portal_candidates WHERE id = ${id}`) as any[];
  if (!rows.length) return null;
  const r = rows[0];
  return rowToCandidate(r.id, new Date(r.created_at).toISOString(), r.data, r.decision, r.note);
}

export async function addCandidate(input: StoredCandidateInput): Promise<StoredCandidate> {
  const id = newId();
  const createdAt = new Date().toISOString();
  if (!hasDb) {
    const cand: StoredCandidate = { id, createdAt, ...input, decision: null, note: null };
    mem.set(id, cand);
    return cand;
  }
  await ensureSchema();
  await db()`INSERT INTO portal_candidates (id, created_at, data) VALUES (${id}, ${createdAt}, ${JSON.stringify({ ...input })}::jsonb)`;
  return { id, createdAt, ...input, decision: null, note: null };
}

export async function deleteCandidate(id: string): Promise<void> {
  if (!hasDb) { mem.delete(id); return; }
  await ensureSchema();
  await db()`DELETE FROM portal_candidates WHERE id = ${id}`;
}

export async function setFeedback(id: string, decision: Decision, note: string): Promise<void> {
  if (!hasDb) {
    const c = mem.get(id);
    if (c) { c.decision = decision; c.note = note; }
    return;
  }
  await ensureSchema();
  await db()`UPDATE portal_candidates SET decision = ${decision}, note = ${note} WHERE id = ${id}`;
}
