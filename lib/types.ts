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
