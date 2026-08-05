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
import type { Decision, PortalSettings, Role, StoredCandidate, StoredCandidateInput, User } from './types';
import portalSeed from './portal-seed.json';
import teamSeed from './team-seed.json';
import { hashPassword } from './auth';

// ---- Auto-seed --------------------------------------------------
// The portal is data-driven: it shows whatever candidates are in the store.
// To make a fresh (or stale) deployment show the intended shortlist without a
// manual step, we seed once per SEED_VERSION. On the first read after a new
// version ships, we clear the old shortlist, insert the seed candidates, and
// set the "prepared for" header — then never touch the data again (so client
// decisions and any later recruiter edits persist). Bump SEED_VERSION in
// lib/portal-seed.json to force a one-time re-seed.
const SEED_VERSION: string = (portalSeed as any).version;
const SEED_SETTINGS = (portalSeed as any).settings as PortalSettings;
const SEED_CANDIDATES = (portalSeed as any).candidates as (StoredCandidateInput & { id: string })[];

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
    experience: Array.isArray(d.experience) ? d.experience : [],
    resumeUrl: d.resumeUrl || '',
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

// Seed the store once per SEED_VERSION. Idempotent and safe to call on every
// read: it no-ops once the current version's marker is present.
let seedReady = false;
async function ensureSeed() {
  if (seedReady) return;

  if (!hasDb) {
    // In-memory fallback: seed once per server process.
    if ((globalThis as any).__spgSeedV !== SEED_VERSION) {
      mem.clear();
      const now = new Date().toISOString();
      for (const c of SEED_CANDIDATES) {
        const { id, ...rest } = c;
        mem.set(id, { id, createdAt: now, ...(rest as StoredCandidateInput), decision: null, note: null });
      }
      memSettings = { ...DEFAULT_SETTINGS, ...SEED_SETTINGS };
      (globalThis as any).__spgSettings = memSettings;
      (globalThis as any).__spgSeedV = SEED_VERSION;
    }
    seedReady = true;
    return;
  }

  await ensureSchema();
  const marker = (await db()`SELECT data FROM portal_settings WHERE id = '__seed__'`) as any[];
  const cur = marker.length ? (typeof marker[0].data === 'string' ? JSON.parse(marker[0].data) : marker[0].data) : null;
  if (cur && cur.version === SEED_VERSION) { seedReady = true; return; }

  // (Re)seed for this version: clear the old shortlist, insert the seed set
  // with stable ids, set the header, and record the marker. Stable ids +
  // upsert keep a rare cold-start race from producing duplicates.
  await db()`DELETE FROM portal_candidates`;
  for (const c of SEED_CANDIDATES) {
    const { id, ...rest } = c;
    await db()`INSERT INTO portal_candidates (id, data) VALUES (${id}, ${JSON.stringify(rest)}::jsonb)
      ON CONFLICT (id) DO UPDATE SET data = ${JSON.stringify(rest)}::jsonb`;
  }
  await db()`INSERT INTO portal_settings (id, data) VALUES ('default', ${JSON.stringify(SEED_SETTINGS)}::jsonb)
    ON CONFLICT (id) DO UPDATE SET data = ${JSON.stringify(SEED_SETTINGS)}::jsonb`;
  await db()`INSERT INTO portal_settings (id, data) VALUES ('__seed__', ${JSON.stringify({ version: SEED_VERSION })}::jsonb)
    ON CONFLICT (id) DO UPDATE SET data = ${JSON.stringify({ version: SEED_VERSION })}::jsonb`;
  seedReady = true;
}

export async function getSettings(): Promise<PortalSettings> {
  await ensureSeed();
  if (!hasDb) return { ...DEFAULT_SETTINGS, ...memSettings };
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
  await ensureSeed();
  if (!hasDb) {
    return [...mem.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }
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

/* ============================================================
   Accounts / team logins
   Users are stored in sm_users (JSONB payload holds name, role,
   passwordHash, mustReset). A bootstrap admin is seeded once so the
   first person can sign in and create the leadership logins.
   ============================================================ */
type UserRaw = User & { passwordHash: string };

const memUsers: Map<string, UserRaw> = (globalThis as any).__spgUsers || ((globalThis as any).__spgUsers = new Map());

// Pre-loaded demo logins (baked in): created once, only if the email is new.
const TEAM_SEED = ((teamSeed as any).users || []) as { name: string; email: string; role: Role; tempPassword: string }[];

function newUserId(): string {
  return 'u_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

let usersSchemaReady = false;
async function ensureUsersSchema() {
  if (!hasDb || usersSchemaReady) return;
  await db()`CREATE TABLE IF NOT EXISTS sm_users (
    id          TEXT PRIMARY KEY,
    email       TEXT UNIQUE NOT NULL,
    data        JSONB NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
  )`;
  usersSchemaReady = true;
}

function rowToUserRaw(id: string, email: string, createdAt: string, data: any): UserRaw {
  const d = typeof data === 'string' ? JSON.parse(data) : (data || {});
  return {
    id,
    email,
    name: d.name || '',
    role: (d.role as Role) || 'member',
    mustReset: !!d.mustReset,
    createdAt,
    passwordHash: d.passwordHash || '',
  };
}

const publicUser = (u: UserRaw): User => ({ id: u.id, email: u.email, name: u.name, role: u.role, mustReset: u.mustReset, createdAt: u.createdAt });

let adminSeedReady = false;
export async function ensureAdminSeed(): Promise<void> {
  if (adminSeedReady) return;
  const email = (process.env.ADMIN_EMAIL || 'admin@spyglassmatrix.app').toLowerCase();
  const password = process.env.ADMIN_PASSWORD || 'ChangeMe-Spyglass';

  if (!hasDb) {
    if (memUsers.size === 0) {
      const id = newUserId();
      memUsers.set(id, { id, email, name: 'Admin', role: 'admin', mustReset: true, createdAt: new Date().toISOString(), passwordHash: hashPassword(password) });
    }
    // Pre-loaded demo logins: create any that don't exist yet.
    for (const u of TEAM_SEED) {
      const em = u.email.trim().toLowerCase();
      let present = false;
      for (const x of memUsers.values()) if (x.email === em) { present = true; break; }
      if (present) continue;
      const id = newUserId();
      memUsers.set(id, { id, email: em, name: u.name, role: (u.role as Role) || 'member', mustReset: true, createdAt: new Date().toISOString(), passwordHash: hashPassword(u.tempPassword) });
    }
    adminSeedReady = true;
    return;
  }
  await ensureUsersSchema();
  const rows = (await db()`SELECT count(*)::int AS n FROM sm_users`) as any[];
  if (!rows.length || rows[0].n === 0) {
    const id = newUserId();
    const data = { name: 'Admin', role: 'admin', mustReset: true, passwordHash: hashPassword(password) };
    await db()`INSERT INTO sm_users (id, email, data) VALUES (${id}, ${email}, ${JSON.stringify(data)}::jsonb)
      ON CONFLICT (email) DO NOTHING`;
  }
  // Pre-loaded demo logins: idempotent insert (only if the email is new).
  for (const u of TEAM_SEED) {
    const em = u.email.trim().toLowerCase();
    const id = newUserId();
    const data = { name: u.name, role: (u.role as Role) || 'member', mustReset: true, passwordHash: hashPassword(u.tempPassword) };
    await db()`INSERT INTO sm_users (id, email, data) VALUES (${id}, ${em}, ${JSON.stringify(data)}::jsonb)
      ON CONFLICT (email) DO NOTHING`;
  }
  adminSeedReady = true;
}

export async function getUserByEmail(email: string): Promise<UserRaw | null> {
  await ensureAdminSeed();
  const key = (email || '').trim().toLowerCase();
  if (!key) return null;
  if (!hasDb) {
    for (const u of memUsers.values()) if (u.email === key) return u;
    return null;
  }
  await ensureUsersSchema();
  const rows = (await db()`SELECT id, email, created_at, data FROM sm_users WHERE email = ${key}`) as any[];
  if (!rows.length) return null;
  const r = rows[0];
  return rowToUserRaw(r.id, r.email, new Date(r.created_at).toISOString(), r.data);
}

export async function getUserById(id: string): Promise<User | null> {
  await ensureAdminSeed();
  if (!hasDb) { const u = memUsers.get(id); return u ? publicUser(u) : null; }
  await ensureUsersSchema();
  const rows = (await db()`SELECT id, email, created_at, data FROM sm_users WHERE id = ${id}`) as any[];
  if (!rows.length) return null;
  const r = rows[0];
  return publicUser(rowToUserRaw(r.id, r.email, new Date(r.created_at).toISOString(), r.data));
}

export async function listUsers(): Promise<User[]> {
  await ensureAdminSeed();
  if (!hasDb) {
    return [...memUsers.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt)).map(publicUser);
  }
  await ensureUsersSchema();
  const rows = (await db()`SELECT id, email, created_at, data FROM sm_users ORDER BY created_at ASC`) as any[];
  return rows.map((r) => publicUser(rowToUserRaw(r.id, r.email, new Date(r.created_at).toISOString(), r.data)));
}

// Create a user with an already-hashed password. Throws 'EMAIL_TAKEN' on dup.
export async function createUser(input: { email: string; name: string; role: Role; passwordHash: string; mustReset: boolean }): Promise<User> {
  await ensureAdminSeed();
  const email = input.email.trim().toLowerCase();
  const existing = await getUserByEmail(email);
  if (existing) throw new Error('EMAIL_TAKEN');
  const id = newUserId();
  const createdAt = new Date().toISOString();
  const data = { name: input.name.trim(), role: input.role, mustReset: input.mustReset, passwordHash: input.passwordHash };
  if (!hasDb) {
    memUsers.set(id, { id, email, createdAt, ...(data as any) });
    return { id, email, name: data.name, role: data.role, mustReset: data.mustReset, createdAt };
  }
  await ensureUsersSchema();
  await db()`INSERT INTO sm_users (id, email, created_at, data) VALUES (${id}, ${email}, ${createdAt}, ${JSON.stringify(data)}::jsonb)`;
  return { id, email, name: data.name, role: data.role, mustReset: data.mustReset, createdAt };
}

export async function updateUserPassword(id: string, passwordHash: string, mustReset: boolean): Promise<void> {
  if (!hasDb) {
    const u = memUsers.get(id);
    if (u) { u.passwordHash = passwordHash; u.mustReset = mustReset; }
    return;
  }
  await ensureUsersSchema();
  // Merge into the existing JSONB payload.
  await db()`UPDATE sm_users
    SET data = data || ${JSON.stringify({ passwordHash, mustReset })}::jsonb
    WHERE id = ${id}`;
}

export async function deleteUser(id: string): Promise<void> {
  if (!hasDb) { memUsers.delete(id); return; }
  await ensureUsersSchema();
  await db()`DELETE FROM sm_users WHERE id = ${id}`;
}

/* ============================================================
   Board notes — shared, persistent notes per role on the Desk.
   Keyed by a stable role slug so the whole team sees the same note.
   ============================================================ */
export type BoardNote = { note: string; by: string; at: string };

const memNotes: Map<string, BoardNote> = (globalThis as any).__spgNotes || ((globalThis as any).__spgNotes = new Map());

let notesSchemaReady = false;
async function ensureNotesSchema() {
  if (!hasDb || notesSchemaReady) return;
  await db()`CREATE TABLE IF NOT EXISTS sm_board_notes (
    key         TEXT PRIMARY KEY,
    note        TEXT NOT NULL DEFAULT '',
    updated_by  TEXT,
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
  )`;
  notesSchemaReady = true;
}

export async function getBoardNotes(): Promise<Record<string, BoardNote>> {
  if (!hasDb) {
    const out: Record<string, BoardNote> = {};
    for (const [k, v] of memNotes) out[k] = v;
    return out;
  }
  await ensureNotesSchema();
  const rows = (await db()`SELECT key, note, updated_by, updated_at FROM sm_board_notes`) as any[];
  const out: Record<string, BoardNote> = {};
  for (const r of rows) out[r.key] = { note: r.note || '', by: r.updated_by || '', at: new Date(r.updated_at).toISOString() };
  return out;
}

export async function setBoardNote(key: string, note: string, by: string): Promise<BoardNote> {
  const at = new Date().toISOString();
  const entry: BoardNote = { note, by, at };
  if (!hasDb) { memNotes.set(key, entry); return entry; }
  await ensureNotesSchema();
  await db()`INSERT INTO sm_board_notes (key, note, updated_by, updated_at)
    VALUES (${key}, ${note}, ${by}, ${at})
    ON CONFLICT (key) DO UPDATE SET note = ${note}, updated_by = ${by}, updated_at = ${at}`;
  return entry;
}
