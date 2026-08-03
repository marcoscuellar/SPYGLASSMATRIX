/* ============================================================
   Spyglass Matrix — shared types
   ============================================================ */

export type BuilderPayload = {
  role: string;
  client: string;
  date: string;
  empType: string;
  salary: string;
  location: string;
  jd: string;
  notes: string;
};

export type MatrixJD = {
  title: string;
  fullText?: string;
  summary: string;
  summary2: string;
  mustHave: string[];
  niceToHave: string[];
};

export type LookFor = { signal: string; detail: string };
export type Question = { q: string; surfaces: string; internal: string };
export type WatchOut = { flag: string; note: string };

export type Matrix = {
  client?: string;
  date?: string;
  empType?: string;
  salary?: string;
  location?: string;
  jd: MatrixJD;
  lookFor: LookFor[];
  questions: Question[];
  targetTitles: string[];
  boolean: string;
  watchOuts: WatchOut[];
  // present on the static sample only
  intake?: {
    meetingDate: string;
    attendees: string[];
    statedNeed: string;
    softSkills: { label: string; note: string }[];
    internalNotes: { tag: string; note: string }[];
  };
};

export type ExtractedFields = Partial<{
  role: string;
  client: string;
  date: string;
  empType: string;
  salary: string;
  location: string;
}>;

export type ScoreKey = 'strong' | 'solid' | 'partial' | 'gap';

export type Signal = { signal: string; score: ScoreKey; evidence: string };

export type Candidate = {
  id: string;
  name: string;
  initials: string;
  fit: number | null;
  stage: string;
  role: string;
  company: string;
  years: number;
  location: string;
  compExp: string;
  avail: string;
  tags: string[];
  approval: 'approved' | 'pending' | null;
  blurb: string;
  dossier: {
    headline: string;
    writeup?: { intro: string; fit: string[]; cta: string };
    summary: string;
    highlights: string[];
    signals: Signal[];
    internalNotes?: { tag: string; note: string }[];
    watchOuts?: string[];
    timeline?: { d: string; e: string }[];
  } | null;
};

export type Decision = 'advance' | 'hold' | 'pass';
export type Feedback = { decision: Decision; note: string };
export type ClientView = { name: 'portal' | 'dossier' | 'placement'; candId: string | null };

// ---- Persisted client-portal candidate (manually added by the recruiter) ----
export type StoredSignal = { signal: string; score: ScoreKey };

// One role in a candidate's employment history (client-facing).
export type ExperienceItem = {
  company: string;
  title: string;
  period: string;        // e.g. "2020 – Present"
  location?: string;
  points: string[];      // highlights for this role
};

export type StoredCandidate = {
  id: string;
  createdAt: string;
  name: string;
  role: string;        // current title
  company: string;
  years: number | null;
  location: string;
  compExp: string;
  avail: string;
  tags: string[];
  fit: number | null;
  headline: string;
  intro: string;       // the brief's opening paragraph
  fitBullets: string[];// "why they fit the brief"
  cta: string;
  signals: StoredSignal[];
  experience: ExperienceItem[]; // employment history
  decision: Decision | null;
  note: string | null;
};

// Everything the admin form submits (no id/createdAt/decision yet).
export type StoredCandidateInput = Omit<StoredCandidate, 'id' | 'createdAt' | 'decision' | 'note'>;

// Portal-level personalization (who the shortlist is prepared for).
export type PortalSettings = {
  clientName: string;   // e.g. "Procare HR"
  roleLabel: string;    // e.g. "Director of Human Resources search"
};
