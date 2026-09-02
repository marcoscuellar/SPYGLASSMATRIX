'use client';
/* ============================================================
   Spyglass Matrix — workroom door
   One shared code unlocks the recruiter workroom for 7 days.
   The code is checked server-side; this only collects it.
   ============================================================ */
import React from 'react';
import { SpyglassMark } from './ui';

export function WorkroomGate({ hint }: { hint: string }) {
  const [code, setCode] = React.useState('');
  const [err, setErr] = React.useState('');
  const [busy, setBusy] = React.useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || busy) return;
    setBusy(true); setErr('');
    try {
      const res = await fetch('/api/workroom/unlock', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      if (res.ok) { window.location.reload(); return; }
      const d = await res.json().catch(() => ({}));
      setErr(d?.error || 'That code is not recognised.');
    } catch {
      setErr('Could not reach the server. Check your connection and try again.');
    }
    setBusy(false);
  };

  return (
    <div className="wrgate">
      <form className="card" onSubmit={submit}>
        <SpyglassMark color="var(--navy)" height={30} />
        <div className="eyebrow">Recruiter workroom</div>
        <h1>Enter your access code</h1>
        <p className="sub">
          This workroom holds internal search strategy — what to look for, screening rationale,
          boolean strings, and watch-outs. Ask your lead for the team code.
        </p>
        <input
          className="codein"
          value={code}
          onChange={(e) => { setCode(e.target.value); setErr(''); }}
          placeholder="ACCESS CODE"
          autoFocus
          autoComplete="off"
          spellCheck={false}
          aria-label="Access code"
        />
        {err && <div className="err" role="alert">{err}</div>}
        <button className="go" type="submit" disabled={busy || !code.trim()}>
          {busy ? 'Checking…' : 'Unlock workroom'}
        </button>
        {hint && <div className="hint">{hint}</div>}
      </form>
    </div>
  );
}
