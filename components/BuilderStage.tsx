'use client';
/* ============================================================
   Spyglass Matrix — Stage 01: the Matrix Builder intake
   Recruiter submits JD + private meeting notes; engagement
   fields auto-fill from the brief (server-side LLM extraction).
   ============================================================ */
import React from 'react';
import { Button, Mark } from './ui';
import { Arrow, UploadIcon, MicIcon, FileGlyph, LockIcon } from './icons';
import { EMP_TYPES, LOCATIONS } from '@/lib/prompts';
import { MATRIX } from '@/lib/data';
import type { BuilderPayload, ExtractedFields } from '@/lib/types';

const intake = MATRIX.intake!;
const SAMPLE_JD = [
  MATRIX.jd.summary, '', MATRIX.jd.summary2, '',
  'MUST HAVE', ...MATRIX.jd.mustHave.map((x) => '• ' + x), '',
  'NICE TO HAVE', ...MATRIX.jd.niceToHave.map((x) => '• ' + x),
].join('\n');
const SAMPLE_NOTES = [
  'Client meeting — ' + intake.meetingDate + '.',
  intake.attendees.join(', ') + '.', '',
  'What they said they need:',
  intake.statedNeed, '',
  'Reading between the lines (the real want):',
  ...intake.softSkills.map((s) => '– ' + s.label + ': ' + s.note), '',
  'Keep internal — never goes in front of a candidate:',
  ...intake.internalNotes.map((n) => '– ' + n.tag + ': ' + n.note),
].join('\n');

export function BuilderStage({ onBuild }: { onBuild: (p: BuilderPayload) => void }) {
  const [role, setRole] = React.useState('');
  const [clientName, setClientName] = React.useState('');
  const [date, setDate] = React.useState('');
  const [empType, setEmpType] = React.useState('');
  const [salary, setSalary] = React.useState('');
  const [location, setLocation] = React.useState('');
  const [extracting, setExtracting] = React.useState(false);
  const [jd, setJd] = React.useState('');
  const [notes, setNotes] = React.useState('');
  const [file, setFile] = React.useState<string | null>(null);
  const [fileHint, setFileHint] = React.useState(false);
  const [listening, setListening] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);
  const ready = !!jd.trim() && !!notes.trim();

  const today = React.useMemo(
    () => new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    [],
  );

  const dictate = () => {
    if (listening) return;
    setListening(true);
    setTimeout(() => setListening(false), 1800);
  };
  const pick = () => fileRef.current?.click();

  const extractFields = async (text: string) => {
    if (!text || !text.trim()) return;
    setExtracting(true);
    try {
      const res = await fetch('/api/extract-fields', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      const o: ExtractedFields = data?.fields || {};
      if (o.role) setRole((v) => v || o.role!);
      if (o.client) setClientName((v) => v || o.client!);
      if (o.date) setDate((v) => v || o.date!);
      if (o.salary) setSalary((v) => v || o.salary!);
      if (o.empType) setEmpType((v) => v || o.empType!);
      if (o.location) setLocation((v) => v || o.location!);
    } catch {
      /* leave fields as-is */
    }
    setExtracting(false);
  };

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!f) return;
    setFile(f.name);
    if (/\.(txt|md|markdown|csv|rtf|json)$/i.test(f.name)) {
      const r = new FileReader();
      r.onload = () => {
        const t = String(r.result || '').trim();
        if (t) { setJd(t); setFileHint(false); extractFields(t); }
      };
      r.readAsText(f);
    } else {
      setFileHint(true);
    }
  };

  const loadSample = () => {
    setRole('Senior Tax Manager');
    setClientName('Meridian Wealth Advisors');
    setDate('2026-06-06');
    setEmpType('Full time — Direct hire');
    setSalary('$160–185k');
    setLocation('Hybrid');
    setJd(SAMPLE_JD);
    setNotes(SAMPLE_NOTES);
    setFile('Senior_Tax_Manager_JD.pdf');
    setFileHint(false);
  };

  return (
    <div className="bld-screen">
      <div className="builder">
        <div className="app-bar">
          <div className="app-bar-l">
            <Mark variant="primary" size={26} />
            <span className="app-wm">SPYGLASS&nbsp;MATRIX</span>
            <span className="app-bc">Builder</span>
          </div>
          <span className="app-meta">{today}</span>
        </div>

        <div className="bld-hero">
          <h2 className="bld-title">Ready. Set.<br />Create a <span className="ed">Spyglass Matrix</span>.</h2>
          <p className="bld-sub">Add the role and drop in the brief. Spyglass drafts the strategy and screening, then splits it into a recruiter copy and a candidate-safe copy.</p>
        </div>

        <div className="bld-card">
          <div className="bld-cardhead">
            <span className="bld-sec">The brief</span>
            <button className="bld-sample" onClick={loadSample}>Load a sample brief</button>
          </div>

          <label className="bld-mini-label" style={{ marginBottom: 9 }}>Job description</label>
          <input ref={fileRef} type="file" accept=".txt,.md,.markdown,.csv,.rtf,.json,.pdf,.doc,.docx" onChange={onPick} style={{ display: 'none' }} />
          <div className="bld-jd-grid">
            <div
              className={'bld-drop' + (file ? ' attached' : '')}
              role="button" tabIndex={0}
              onClick={file ? undefined : pick}
              onKeyDown={(e) => { if (!file && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); pick(); } }}
            >
              {file ? (
                <div>
                  <span className="bld-drop-ic"><FileGlyph c="var(--navy)" s={18} /></span>
                  <div className="fn">{file}</div>
                  <div className="fm">{fileHint ? 'Can’t read this here — paste it instead' : 'Loaded · read on submit'}</div>
                  <button className="bld-ghost" onClick={(e) => { e.stopPropagation(); pick(); }}>Replace</button>
                </div>
              ) : (
                <div>
                  <span className="bld-drop-ic"><UploadIcon c="var(--navy)" s={20} /></span>
                  <div className="bld-drop-t">Upload here</div>
                  <div className="bld-drop-d">PDF · DOCX · TXT</div>
                </div>
              )}
            </div>
            <textarea className="bld-ta" style={{ minHeight: 150 }} value={jd} onChange={(e) => setJd(e.target.value)} placeholder="…or paste the job description text." />
          </div>

          <div className="bld-field" style={{ marginTop: 22, marginBottom: 0 }}>
            <div className="bld-flabel">
              <span className="l">Your meeting notes</span>
              <button className={'bld-ghost' + (listening ? ' on' : '')} onClick={dictate}>
                {listening
                  ? <><span style={{ width: 7, height: 7, borderRadius: 99, background: 'var(--navy)', display: 'inline-block', animation: 'spgFade .8s var(--ease) infinite alternate' }} /> Listening…</>
                  : <><MicIcon /> Dictate</>}
              </button>
            </div>
            <textarea className="bld-ta" style={{ minHeight: 132 }} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="What did they actually say? The stuff between the lines — culture, dealbreakers, who burned them last time…" />
          </div>

          <div className="bld-sec-rule" />
          <div className="bld-cardhead">
            <span className="bld-sec">The engagement</span>
            <button className="bld-sample" onClick={() => extractFields((jd + '\n\n' + notes).trim())} disabled={extracting || !(jd.trim() || notes.trim())}>
              {extracting ? 'Reading the brief…' : '✨ Auto-fill from brief'}
            </button>
          </div>
          <div className="bld-row">
            <div><label className="bld-mini-label">Role</label><input className="bld-input" value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. Senior Tax Manager" /></div>
            <div><label className="bld-mini-label">Client</label><input className="bld-input" value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="e.g. Meridian Wealth Advisors" /></div>
          </div>
          <div className="bld-row" style={{ marginTop: 14 }}>
            <div><label className="bld-mini-label">Date opened</label><input type="date" className="bld-input" value={date} onChange={(e) => setDate(e.target.value)} /></div>
            <div>
              <label className="bld-mini-label">Engagement type</label>
              <select className={'bld-select' + (empType ? '' : ' placeholder')} value={empType} onChange={(e) => setEmpType(e.target.value)}>
                <option value="">Select…</option>
                {EMP_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="bld-row" style={{ marginTop: 14 }}>
            <div><label className="bld-mini-label">Salary / hourly rate</label><input className="bld-input" value={salary} onChange={(e) => setSalary(e.target.value)} placeholder="e.g. $160–185k or $75/hr" /></div>
            <div>
              <label className="bld-mini-label">Location</label>
              <select className={'bld-select' + (location ? '' : ' placeholder')} value={location} onChange={(e) => setLocation(e.target.value)}>
                <option value="">Select…</option>
                {LOCATIONS.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          </div>

          <div className="bld-buildbar">
            <span className="note"><LockIcon c="currentColor" /> Your notes shape the strategy — the candidate copy never shows them.</span>
            <Button kind="amber" icon={<Arrow />} onClick={() => ready && onBuild({ role, client: clientName, date, empType, salary, location, jd, notes })} disabled={!ready}>
              Build the Spyglass Matrix
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
