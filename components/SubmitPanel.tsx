'use client';
/* ============================================================
   Spyglass Matrix — "Submit to Marcos" (section 05)
   The recruiter's hand-off at the foot of the Matrix: their read,
   their notes, the résumé. Goes to the internal desk — never to
   the client.
   ============================================================ */
import React from 'react';
import type { SubmissionRead } from '@/lib/types';

const READS: { k: SubmissionRead; t: string; d: string }[] = [
  { k: 'advance', t: 'Advance', d: 'Worth Marcos’s time' },
  { k: 'fence', t: 'On the fence', d: 'Needs a second read' },
  { k: 'pass', t: 'Pass', d: 'Not the right shape' },
];

export function SubmitPanel({ matrixId, roleTitle }: { matrixId: string; roleTitle: string }) {
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [cand, setCand] = React.useState('');
  const [read, setRead] = React.useState<SubmissionRead | ''>('');
  const [notes, setNotes] = React.useState('');
  const [file, setFile] = React.useState<File | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState('');
  const [done, setDone] = React.useState<{ emailed: boolean } | null>(null);
  const fileRef = React.useRef<HTMLInputElement>(null);

  // The recruiter is the same person all day; remember who they are.
  React.useEffect(() => {
    try {
      setName(localStorage.getItem('sm_rec_name') || '');
      setEmail(localStorage.getItem('sm_rec_email') || '');
    } catch { /* private mode — just start blank */ }
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true); setErr('');
    try {
      try {
        localStorage.setItem('sm_rec_name', name);
        localStorage.setItem('sm_rec_email', email);
      } catch { /* non-fatal */ }

      const fd = new FormData();
      fd.set('matrixId', matrixId);
      fd.set('recruiterName', name);
      fd.set('recruiterEmail', email);
      fd.set('candidateName', cand);
      fd.set('read', read);
      fd.set('notes', notes);
      if (file) fd.set('resume', file);

      const res = await fetch('/api/workroom/submit', { method: 'POST', body: fd });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) { setErr(d?.error || 'Could not submit. Try again.'); setBusy(false); return; }
      setDone({ emailed: !!d.emailed });
    } catch {
      setErr('Could not reach the server. Your notes are still on this page — try again.');
    }
    setBusy(false);
  };

  if (done) {
    return (
      <section id="submit" className="subpanel done print-hide">
        <div className="tick">✓</div>
        <h2>{cand} is with Marcos.</h2>
        <p>
          {done.emailed
            ? 'Logged on the desk and emailed straight to his inbox — not to the client.'
            : 'Logged on the desk, where Marcos picks it up. (Email notifications aren’t configured on this deployment, so nothing was emailed.)'}
        </p>
        <button
          className="again"
          onClick={() => { setDone(null); setCand(''); setRead(''); setNotes(''); setFile(null); if (fileRef.current) fileRef.current.value = ''; }}
        >
          Submit another candidate
        </button>
      </section>
    );
  }

  return (
    <section id="submit" className="subpanel print-hide">
      <div className="sec-label">Submit to Marcos <span className="int">Internal</span></div>
      <h2>Recruiter’s desk → Marcos</h2>
      <p className="lede">
        Fill in your notes from the screen and attach the candidate’s résumé. This goes to Marcos,
        not the client.
      </p>

      <form onSubmit={submit}>
        <div className="row2">
          <label>
            <span>Your name</span>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Which recruiter is this from?" />
          </label>
          <label>
            <span>Your email (so Marcos can reply)</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@ollinos.com" />
          </label>
        </div>

        <label className="block">
          <span>Candidate name</span>
          <input value={cand} onChange={(e) => setCand(e.target.value)} placeholder="Candidate’s full name" />
        </label>

        <div className="readblock">
          <span className="lbl">Your read</span>
          <div className="reads">
            {READS.map((r) => (
              <button type="button" key={r.k} className={'readbtn ' + r.k + (read === r.k ? ' on' : '')} onClick={() => setRead(r.k)}>
                <b>{r.t}</b><i>{r.d}</i>
              </button>
            ))}
          </div>
        </div>

        <label className="block">
          <span>Notes / screen summary</span>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Paste or write your screening notes, overall read on fit…" />
        </label>

        <div className="filerow">
          <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.rtf,.txt,.md" style={{ display: 'none' }}
            onChange={(e) => setFile(e.target.files?.[0] || null)} />
          <button type="button" className="attach" onClick={() => fileRef.current?.click()}>
            {file ? `${file.name} · ${(file.size / 1024 / 1024).toFixed(1)}MB` : 'Click to attach a résumé (PDF, Word, RTF or TXT — under 3MB)'}
          </button>
          {file && <button type="button" className="clearfile" onClick={() => { setFile(null); if (fileRef.current) fileRef.current.value = ''; }}>Remove</button>}
        </div>

        {err && <div className="err" role="alert">{err}</div>}
        <button className="send" type="submit" disabled={busy}>{busy ? 'Sending…' : 'Submit to Marcos →'}</button>
        <div className="foot">Screening for <b>{roleTitle}</b>. Your notes above stay in the workroom; only this form is sent.</div>
      </form>
    </section>
  );
}
