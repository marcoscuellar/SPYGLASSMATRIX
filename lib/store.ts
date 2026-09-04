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

import { randomBytes } from 'crypto';
import { neon } from '@neondatabase/serverless';
import type { Decision, Matrix, MatrixWork, PortalSettings, Role, StoredCandidate, StoredCandidateInput, StoredMatrix, Submission, SubmissionInput, User } from './types';
import portalSeed from './portal-seed.json';
import matrixSeed from './matrix-seed.json';
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
// Candidate ids whose decision and note are wiped on the next re-seed. The
// seed otherwise never touches those columns, so this is the one deliberate
// way to take back a decision recorded by mistake. Fires once, when the seed
// version changes; clear the list afterwards so it cannot fire again.
const SEED_RESET_DECISIONS: string[] = (portalSeed as any).resetDecisions || [];

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
//
// fetchOptions.cache = 'no-store' is not optional. The Neon driver talks to the
// database over HTTP, and Next.js patches global fetch so that server-side
// requests are cached — to disk, under .next/cache/fetch-cache, where they
// outlive a restart. Without this the cache swallows the database: SELECTs
// return whatever the first render saw, so a recruiter's edit or a client's
// decision never shows up, and INSERTs are served from cache and never reach
// Postgres at all. Verified against a real Postgres: with it off, cached
// SELECT/INSERT/CREATE entries appeared on disk and the portal served stale
// candidates indefinitely.
let _sql: ReturnType<typeof neon> | null = null;
function db() {
  if (!_sql) _sql = neon(CONN, { fetchOptions: { cache: 'no-store' } });
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
    workAuth: d.workAuth || '',
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

// `CREATE TABLE IF NOT EXISTS` is not race-safe in Postgres: two connections
// running it at the same instant against an empty database both pass the
// existence check, and the loser fails on a system-catalogue unique index. The
// first request after a deploy is exactly that case — several lambdas hitting a
// cold database at once — so without this the portal 500s on the very first
// visit and then works forever after, which is the worst way to find out.
// Either outcome leaves the table in place, so these two codes mean success.
async function ensureTable(create: () => Promise<unknown>) {
  try {
    await create();
  } catch (e: any) {
    const code = e?.code ?? e?.sourceError?.code;
    if (code !== '23505' && code !== '42P07') throw e; // unique_violation, duplicate_table
  }
}

let schemaReady = false;
async function ensureSchema() {
  if (!hasDb || schemaReady) return;
  await ensureTable(() => db()`CREATE TABLE IF NOT EXISTS portal_candidates (
    id          TEXT PRIMARY KEY,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    data        JSONB NOT NULL,
    decision    TEXT,
    note        TEXT
  )`);
  await ensureTable(() => db()`CREATE TABLE IF NOT EXISTS portal_settings (
    id    TEXT PRIMARY KEY,
    data  JSONB NOT NULL
  )`);
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
      const now = new Date().toISOString();
      const keep = new Set(SEED_CANDIDATES.map((c) => c.id));
      for (const id of [...mem.keys()]) if (!keep.has(id)) mem.delete(id);
      for (const c of SEED_CANDIDATES) {
        const { id, ...rest } = c;
        // Same rule as the database branch: refresh the copy, keep the answer.
        const prev = SEED_RESET_DECISIONS.includes(id) ? undefined : mem.get(id);
        mem.set(id, {
          id, createdAt: mem.get(id)?.createdAt || now, ...(rest as StoredCandidateInput),
          decision: prev?.decision ?? null, note: prev?.note ?? null,
        });
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

  // (Re)seed for this version. Deliberately NOT a DELETE-everything: decision
  // and note live in their own columns, so wiping the table to reinsert would
  // throw away the client's Advance/Hold/Pass answers and their notes every
  // time we add a candidate to the shortlist. Instead, drop only the rows this
  // seed no longer lists, then upsert the rest — the upsert rewrites `data`
  // (the copy we ship) and leaves decision and note untouched.
  const keep = SEED_CANDIDATES.map((c) => c.id);
  if (keep.length) await db()`DELETE FROM portal_candidates WHERE id <> ALL(${keep})`;
  else await db()`DELETE FROM portal_candidates`;
  for (const c of SEED_CANDIDATES) {
    const { id, ...rest } = c;
    await db()`INSERT INTO portal_candidates (id, data) VALUES (${id}, ${JSON.stringify(rest)}::jsonb)
      ON CONFLICT (id) DO UPDATE SET data = ${JSON.stringify(rest)}::jsonb`;
  }
  if (SEED_RESET_DECISIONS.length) {
    await db()`UPDATE portal_candidates SET decision = NULL, note = NULL WHERE id = ANY(${SEED_RESET_DECISIONS})`;
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
  const arr = (v: any): string[] => (Array.isArray(v) ? v.map(String).map((x) => x.trim()).filter(Boolean) : []);
  const clean: PortalSettings = {
    clientName: String(s.clientName || ''),
    roleLabel: String(s.roleLabel || ''),
    lookingFor: {
      intro: String(s.lookingFor?.intro || '').trim(),
      mustHave: arr(s.lookingFor?.mustHave),
      niceToHave: arr(s.lookingFor?.niceToHave),
    },
  };
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

export async function updateCandidate(id: string, input: StoredCandidateInput): Promise<StoredCandidate | null> {
  const existing = await getCandidate(id);
  if (!existing) return null;
  const next: StoredCandidate = { ...existing, ...input };
  if (!hasDb) { mem.set(id, next); return next; }
  await ensureSchema();
  const { id: _i, createdAt: _c, decision: _d, note: _n, ...data } = next;
  await db()`UPDATE portal_candidates SET data = ${JSON.stringify(data)}::jsonb WHERE id = ${id}`;
  return next;
}

export async function deleteCandidate(id: string): Promise<void> {
  if (!hasDb) { mem.delete(id); return; }
  await ensureSchema();
  await db()`DELETE FROM portal_candidates WHERE id = ${id}`;
}

// Three cases, deliberately distinct:
//   decision set        -> record it
//   decision null       -> save the note only, leave any decision alone
//   clear = true        -> take the decision back to undecided
// The client must be able to undo an answer they gave by mistake.
export async function setFeedback(id: string, decision: Decision | null, note: string, clear = false): Promise<void> {
  if (!hasDb) {
    const c = mem.get(id);
    if (c) {
      if (clear) c.decision = null;
      else if (decision) c.decision = decision;
      c.note = note;
    }
    return;
  }
  await ensureSchema();
  if (clear) {
    await db()`UPDATE portal_candidates SET decision = NULL, note = ${note} WHERE id = ${id}`;
  } else if (decision) {
    await db()`UPDATE portal_candidates SET decision = ${decision}, note = ${note} WHERE id = ${id}`;
  } else {
    await db()`UPDATE portal_candidates SET note = ${note} WHERE id = ${id}`;
  }
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
// Revoked emails: deleted on boot and never recreated (e.g. clients who must lose access).
const REVOKED_EMAILS = (((teamSeed as any).revoked || []) as string[]).map((e) => String(e).trim().toLowerCase());

function newUserId(): string {
  return 'u_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

let usersSchemaReady = false;
async function ensureUsersSchema() {
  if (!hasDb || usersSchemaReady) return;
  await ensureTable(() => db()`CREATE TABLE IF NOT EXISTS sm_users (
    id          TEXT PRIMARY KEY,
    email       TEXT UNIQUE NOT NULL,
    data        JSONB NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
  )`);
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

// The temp password for a pre-loaded login. In production it must come from
// the environment (SEED_TEMP_PASSWORD) — the value in lib/team-seed.json is a
// convenience for local work, and a password committed to the repo is not a
// password. Absent that, the account is created with a random secret nobody
// holds, so it cannot be signed into until a password is set on purpose.
function seedPasswordFor(u: { email: string; tempPassword?: string }): string {
  if (process.env.NODE_ENV !== 'production') return u.tempPassword || 'ChangeMe-Spyglass';
  return process.env.SEED_TEMP_PASSWORD || randomBytes(32).toString('hex');
}

const publicUser = (u: UserRaw): User => ({ id: u.id, email: u.email, name: u.name, role: u.role, mustReset: u.mustReset, createdAt: u.createdAt });

let adminSeedReady = false;
export async function ensureAdminSeed(): Promise<void> {
  if (adminSeedReady) return;
  const email = (process.env.ADMIN_EMAIL || 'admin@spyglassmatrix.app').toLowerCase();
  // No fallback password in production. A default written in the source is a
  // password every reader of the repo already knows, and it was seeding a live
  // admin account. Off the default, we mint a random one nobody holds — the
  // account exists but cannot be signed into until a password is set
  // deliberately, which is the safe state for an account nobody asked for.
  const password = process.env.ADMIN_PASSWORD
    || (process.env.NODE_ENV === 'production' ? randomBytes(32).toString('hex') : 'ChangeMe-Spyglass');

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
      memUsers.set(id, { id, email: em, name: u.name, role: (u.role as Role) || 'member', mustReset: true, createdAt: new Date().toISOString(), passwordHash: hashPassword(seedPasswordFor(u)) });
    }
    // Revoked emails: delete any matching account so access is fully removed.
    for (const em of REVOKED_EMAILS) {
      for (const [id, x] of memUsers) if (x.email === em) memUsers.delete(id);
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
    const data = { name: u.name, role: (u.role as Role) || 'member', mustReset: true, passwordHash: hashPassword(seedPasswordFor(u)) };
    await db()`INSERT INTO sm_users (id, email, data) VALUES (${id}, ${em}, ${JSON.stringify(data)}::jsonb)
      ON CONFLICT (email) DO NOTHING`;
  }
  // Revoked emails: delete any matching account so access is fully removed.
  for (const em of REVOKED_EMAILS) {
    await db()`DELETE FROM sm_users WHERE email = ${em}`;
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
  await ensureTable(() => db()`CREATE TABLE IF NOT EXISTS sm_board_notes (
    key         TEXT PRIMARY KEY,
    note        TEXT NOT NULL DEFAULT '',
    updated_by  TEXT,
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
  )`);
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

/* ============================================================
   Recruiter workroom — saved matrices + live interview state
   Matrices live in sm_matrices (JSONB payload holds the Matrix and
   the accumulated notes/grades). Seeded once per MATRIX_SEED_VERSION
   so a fresh deployment already has the team's roles to work on.
   ============================================================ */

const MATRIX_SEED_VERSION: string = (matrixSeed as any).version;
const MATRIX_SEED = (matrixSeed as any).matrices as (Matrix & { id: string })[];

const memMatrices: Map<string, StoredMatrix> =
  (globalThis as any).__spgMatrices || ((globalThis as any).__spgMatrices = new Map());

const emptyWork = (): MatrixWork => ({ notes: {}, grades: {}, updatedAt: null, updatedBy: '' });

let matrixSchemaReady = false;
async function ensureMatrixSchema(): Promise<void> {
  if (matrixSchemaReady || !hasDb) return;
  await ensureTable(() => db()`CREATE TABLE IF NOT EXISTS sm_matrices (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    data JSONB NOT NULL
  )`);
  matrixSchemaReady = true;
}

function rowToMatrix(id: string, createdAt: string, data: any): StoredMatrix {
  const d = typeof data === 'string' ? JSON.parse(data) : (data || {});
  return { id, createdAt, matrix: d.matrix, work: { ...emptyWork(), ...(d.work || {}) } };
}

let matrixSeedReady = false;
async function ensureMatrixSeed(): Promise<void> {
  if (matrixSeedReady) return;
  const seed = (m: Matrix & { id: string }): StoredMatrix => {
    const { id, ...rest } = m;
    return { id, createdAt: new Date().toISOString(), matrix: rest as Matrix, work: emptyWork() };
  };
  if (!hasDb) {
    // Seed only what is missing, so notes typed in this instance survive.
    for (const m of MATRIX_SEED) if (!memMatrices.has(m.id)) memMatrices.set(m.id, seed(m));
    matrixSeedReady = true;
    return;
  }
  await ensureMatrixSchema();
  for (const m of MATRIX_SEED) {
    const s = seed(m);
    // DO NOTHING on conflict: never clobber work a recruiter has already saved.
    await db()`INSERT INTO sm_matrices (id, created_at, data)
      VALUES (${s.id}, ${s.createdAt}, ${JSON.stringify({ matrix: s.matrix, work: s.work, seed: MATRIX_SEED_VERSION })}::jsonb)
      ON CONFLICT (id) DO NOTHING`;
  }
  matrixSeedReady = true;
}

export async function listMatrices(): Promise<StoredMatrix[]> {
  await ensureMatrixSeed();
  if (!hasDb) return [...memMatrices.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const rows = (await db()`SELECT id, created_at, data FROM sm_matrices ORDER BY created_at ASC`) as any[];
  return rows.map((r) => rowToMatrix(r.id, new Date(r.created_at).toISOString(), r.data));
}

export async function getMatrix(id: string): Promise<StoredMatrix | null> {
  await ensureMatrixSeed();
  if (!hasDb) return memMatrices.get(id) || null;
  const rows = (await db()`SELECT id, created_at, data FROM sm_matrices WHERE id = ${id}`) as any[];
  if (!rows.length) return null;
  return rowToMatrix(rows[0].id, new Date(rows[0].created_at).toISOString(), rows[0].data);
}

export async function saveMatrixWork(id: string, work: Partial<MatrixWork>): Promise<MatrixWork | null> {
  await ensureMatrixSeed();
  const existing = await getMatrix(id);
  if (!existing) return null;
  const next: MatrixWork = {
    notes: work.notes ?? existing.work.notes,
    grades: work.grades ?? existing.work.grades,
    updatedBy: work.updatedBy ?? existing.work.updatedBy,
    updatedAt: new Date().toISOString(),
  };
  if (!hasDb) {
    memMatrices.set(id, { ...existing, work: next });
    return next;
  }
  await ensureMatrixSchema();
  // Merge into the JSONB payload so the Matrix itself is never rewritten.
  await db()`UPDATE sm_matrices SET data = data || ${JSON.stringify({ work: next })}::jsonb WHERE id = ${id}`;
  return next;
}


/* ============================================================
   Recruiter submissions — the workroom's "Submit to Marcos" step
   Stored first, emailed second: a notification that fails to send
   must never mean a lost candidate.
   ============================================================ */

const memSubs: Map<string, Submission> =
  (globalThis as any).__spgSubs || ((globalThis as any).__spgSubs = new Map());

let subSchemaReady = false;
async function ensureSubSchema(): Promise<void> {
  if (subSchemaReady || !hasDb) return;
  await ensureTable(() => db()`CREATE TABLE IF NOT EXISTS sm_submissions (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    data JSONB NOT NULL
  )`);
  subSchemaReady = true;
}

function rowToSub(id: string, createdAt: string, data: any): Submission {
  const d = typeof data === 'string' ? JSON.parse(data) : (data || {});
  return { id, createdAt, ...d } as Submission;
}

export async function addSubmission(input: SubmissionInput): Promise<Submission> {
  const id = 's_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
  const createdAt = new Date().toISOString();
  const sub: Submission = { id, createdAt, ...input, emailed: false };
  if (!hasDb) { memSubs.set(id, sub); return sub; }
  await ensureSubSchema();
  const { id: _i, createdAt: _c, ...rest } = sub;
  await db()`INSERT INTO sm_submissions (id, created_at, data) VALUES (${id}, ${createdAt}, ${JSON.stringify(rest)}::jsonb)`;
  return sub;
}

export async function markSubmissionEmailed(id: string, emailed: boolean): Promise<void> {
  if (!hasDb) { const s = memSubs.get(id); if (s) s.emailed = emailed; return; }
  await ensureSubSchema();
  await db()`UPDATE sm_submissions SET data = data || ${JSON.stringify({ emailed })}::jsonb WHERE id = ${id}`;
}

/** The desk list. Résumé blobs are stripped — they are fetched one at a time. */
export async function listSubmissions(): Promise<Submission[]> {
  const strip = (s: Submission): Submission =>
    ({ ...s, resume: s.resume ? { ...s.resume, data: '' } : null });
  if (!hasDb) {
    return [...memSubs.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(strip);
  }
  await ensureSubSchema();
  const rows = (await db()`SELECT id, created_at, data FROM sm_submissions ORDER BY created_at DESC`) as any[];
  return rows.map((r) => strip(rowToSub(r.id, new Date(r.created_at).toISOString(), r.data)));
}

export async function getSubmission(id: string): Promise<Submission | null> {
  if (!hasDb) return memSubs.get(id) || null;
  await ensureSubSchema();
  const rows = (await db()`SELECT id, created_at, data FROM sm_submissions WHERE id = ${id}`) as any[];
  if (!rows.length) return null;
  return rowToSub(rows[0].id, new Date(rows[0].created_at).toISOString(), rows[0].data);
}
