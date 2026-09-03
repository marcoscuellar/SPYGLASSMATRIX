'use client';
/* ============================================================
   Spyglass Matrix — client portal door
   Sits at /portal itself: the client opens the link they were
   sent, types the code once, and lands straight in the shortlist
   at the same URL. No second page, no redirect.
   ============================================================ */
import React from 'react';
import { SpyglassMark } from './ui';

export function PortalGate({ client, role }: { client: string; role: string }) {
  const [code, setCode] = React.useState('');
  const [err, setErr] = React.useState('');
  const [busy, setBusy] = React.useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || busy) return;
    setBusy(true); setErr('');
    try {
      const res = await fetch('/api/portal/unlock', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      // Straight into the portal: same URL, now past the door.
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
        <div className="eyebrow">{client ? `${client} · client portal` : 'Client portal'}</div>
        <h1>Enter your access code</h1>
        <p className="sub">
          {role ? `Your shortlist for the ${role} is behind this code.` : 'Your shortlist is behind this code.'}
          {' '}It was sent with your link — enter it once and this device stays signed in.
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
          {busy ? 'Checking…' : 'Open my shortlist'}
        </button>
      </form>
    </div>
  );
}
