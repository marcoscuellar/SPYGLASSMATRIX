'use client';
/* ============================================================
   Spyglass Matrix — client-facing portal
   Application shell modelled on the ATS reference: fixed sidebar,
   top bar, profile + résumé column, stat cards, tabbed detail
   panel, and a hiring-journey stepper. Maroon accent, .pv namespace.
   ============================================================ */
import React from 'react';
import type { Decision, PortalSettings, ScoreKey, StoredCandidate } from '@/lib/types';

function initialsOf(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((s) => s[0]?.toUpperCase() || '').join('') || '—';
}

const SIGNAL_META: Record<ScoreKey, { pct: number; label: string }> = {
  strong: { pct: 100, label: 'Strong' },
  solid: { pct: 68, label: 'Solid' },
  partial: { pct: 34, label: 'Partial' },
  gap: { pct: 0, label: 'Gap' },
};

const DECIDED: Record<Decision, string> = { advance: 'Advanced', hold: 'On hold', pass: 'Passed' };
const STATUS: Record<Decision, string> = {
  advance: 'We’re setting up the interview and will confirm times with you.',
  hold: 'Kept warm. Tell us when you want to revisit.',
  pass: 'Noted — we’ll keep looking and come back with more.',
};

/* ---------- icons (inline, no assets) ---------- */
const I = {
  grid: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',
  users: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
  cal: 'M3 5h18v16H3zM3 10h18M8 3v4M16 3v4',
  pin: 'M21 10c0 7-9 12-9 12s-9-5-9-12a9 9 0 0 1 18 0M12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6',
  clock: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20M12 6v6l4 2',
  cash: 'M2 6h20v12H2zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6',
  file: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6',
  down: 'M12 3v12m0 0 4-4m-4 4-4-4M4 19h16',
};
const Ico = ({ d, s = 14 }: { d: string; s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>
);

export function PortalView({ initial, settings }: { initial: StoredCandidate[]; settings: PortalSettings }) {
  const [cands, setCands] = React.useState<StoredCandidate[]>(initial);
  const sorted = React.useMemo(() => [...cands].sort((a, b) => (b.fit ?? 0) - (a.fit ?? 0)), [cands]);
  const [openId, setOpenId] = React.useState<string | null>(null);
  const open = sorted.find((c) => c.id === openId) || null;

  const applyFeedback = (id: string, decision: Decision | null, note: string) =>
    setCands((l) => l.map((c) => (c.id === id ? { ...c, decision: decision ?? c.decision, note } : c)));

  const client = settings.clientName.trim();
  const role = settings.roleLabel.trim();

  return (
    <div className="pv">
      {/* ---------- sidebar ---------- */}
      <aside className="side">
        <div className="brand">
          <span className="logo">SM</span>
          <span className="bt">Spyglass Matrix<em>Client portal</em></span>
        </div>

        <div className="navlabel">Search</div>
        <button className={'navitem' + (!open ? ' on' : '')} onClick={() => { setOpenId(null); window.scrollTo(0, 0); }}>
          <Ico d={I.grid} /> Shortlist
        </button>

        <div className="navlabel">Candidates</div>
        {sorted.map((c) => (
          <button key={c.id} className={'navitem' + (openId === c.id ? ' on' : '')}
            onClick={() => { setOpenId(c.id); window.scrollTo(0, 0); }}>
            <Ico d={I.users} /> <span className="nm">{c.name}</span>
            {c.decision && <span className="ndot" />}
          </button>
        ))}

        <div className="sidefoot">Held in confidence between {client || 'you'} and Spyglass.</div>
      </aside>

      {/* ---------- main ---------- */}
      <div className="main">
        <header className="topbar">
          <span className="ctx">{role || 'Shortlist'}</span>
          <span className="grow" />
          <span className="conf">Confidential</span>
          <div className="chip">
            <div className="cn">{client || 'Client'}<em>Hiring team</em></div>
            <span className="cav">{initialsOf(client || 'Client')}</span>
          </div>
        </header>

        <div className="body">
          {open
            ? <Profile c={open} role={role} onFeedback={applyFeedback} />
            : <Shortlist cands={sorted} client={client} role={role} onOpen={(id) => { setOpenId(id); window.scrollTo(0, 0); }} />}
        </div>
      </div>
    </div>
  );
}

/* ---------- shortlist ---------- */

function Shortlist({ cands, client, role, onOpen }: { cands: StoredCandidate[]; client: string; role: string; onOpen: (id: string) => void }) {
  return (
    <>
      <div className="crumb">Shortlist{role && <> <i>›</i> {role}</>}</div>
      <div className="pagehd">
        <h1>{role || 'Your shortlist'}</h1>
        <p>{cands.length > 0
          ? `${cands.length} candidate${cands.length === 1 ? '' : 's'} presented${client ? ` to ${client}` : ''}. Open one to read the brief, work through their experience, and leave your notes.`
          : 'Your shortlist is being prepared. Candidates will appear here as soon as they’re ready.'}</p>
      </div>

      {cands.length === 0 ? (
        <div className="card empty">No candidates presented yet.</div>
      ) : (
        <div className="deck">
          {cands.map((c, i) => (
            <button className="card pc" key={c.id} onClick={() => onOpen(c.id)}>
              <div className="pchd">
                <span className="av">{initialsOf(c.name)}</span>
                <div>
                  <div className="nm">{c.name}</div>
                  <div className="rl">{c.role}</div>
                </div>
                <span className="rk">{String(i + 1).padStart(2, '0')}</span>
              </div>
              {c.headline && <p className="hl">{c.headline}</p>}
              {c.tags.length > 0 && <div className="tags">{c.tags.slice(0, 3).map((t, j) => <span className="tg" key={j}>{t}</span>)}</div>}
              <div className="pcft">
                {c.decision ? <span className={'badge ' + c.decision}>{DECIDED[c.decision]}</span> : <span className="badge muted">Awaiting your call</span>}
                <span className="go">View profile →</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </>
  );
}

/* ---------- profile detail ---------- */

type Tab = 'brief' | 'experience' | 'notes';

function Profile({ c, role, onFeedback }: { c: StoredCandidate; role: string; onFeedback: (id: string, d: Decision | null, n: string) => void }) {
  const [tab, setTab] = React.useState<Tab>('brief');
  const [decision, setDecision] = React.useState<Decision | null>(c.decision);
  const [note, setNote] = React.useState(c.note || '');
  const [savedNote, setSavedNote] = React.useState(c.note || '');
  const [busy, setBusy] = React.useState<'' | 'd' | 'n'>('');
  const first = c.name.split(' ')[0];

  React.useEffect(() => {
    setDecision(c.decision); setNote(c.note || ''); setSavedNote(c.note || ''); setTab('brief');
  }, [c.id, c.decision, c.note]);

  const facts = [
    { i: I.pin, k: 'Location', v: c.location },
    { i: I.clock, k: 'Availability', v: c.avail },
    { i: I.cash, k: 'Compensation', v: c.compExp },
    { i: I.cal, k: 'Experience', v: c.years ? `${c.years} years` : '' },
  ].filter((f) => f.v);

  const visibleSignals = c.signals.filter((s) => s.score !== 'gap');
  const noteDirty = note !== savedNote;

  const send = async (d: Decision | null, n: string) => {
    setBusy(d ? 'd' : 'n');
    await fetch(`/api/candidates/${c.id}/feedback`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ decision: d, note: n }),
    }).catch(() => {});
    setBusy('');
    if (d) setDecision(d);
    setSavedNote(n);
    onFeedback(c.id, d, n);
  };

  const steps = [
    { l: 'Submitted', s: 'done' },
    { l: 'Your review', s: decision ? 'done' : 'cur' },
    { l: decision ? DECIDED[decision] : 'Decision', s: decision ? 'cur' : 'todo' },
    { l: decision === 'advance' ? 'Interview' : 'Next step', s: 'todo' },
  ];

  return (
    <>
      <div className="crumb">Candidates <i>›</i> {role || 'Shortlist'} <i>›</i> <b>Profile</b></div>

      <div className="pagehd row">
        <h1>{c.name}</h1>
        <div className="acts">
          <button className="btn" disabled={busy === 'd'} onClick={() => send('pass', note)}>Pass</button>
          <button className="btn ghost" disabled={busy === 'd'} onClick={() => send('hold', note)}>Hold for now</button>
          <button className="btn go" disabled={busy === 'd'} onClick={() => send('advance', note)}>Advance to interview</button>
        </div>
      </div>

      <div className="pgrid">
        {/* left column */}
        <div className="colL">
          <div className="card idc">
            <span className="bigav">{initialsOf(c.name)}</span>
            <div className="nm">{c.name}</div>
            <div className="rl">{c.role}</div>
            {c.company && <div className="co">{c.company}</div>}
            <div className="facts">
              {facts.map((f, i) => (
                <div className="fact" key={i}>
                  <span className="fi"><Ico d={f.i} /></span>
                  <div><div className="k">{f.k}</div><div className="v">{f.v}</div></div>
                </div>
              ))}
            </div>
          </div>

          {c.resumeUrl && (
            <div className="card resc">
              <div className="cardhd"><span>Résumé</span></div>
              <div className="filebox">
                <span className="fic"><Ico d={I.file} s={20} /></span>
                <div className="fnm">{c.resumeUrl.split('/').pop()}</div>
                <div className="fmeta">Provided by Spyglass</div>
              </div>
              <a className="btn wide" href={c.resumeUrl} target="_blank" rel="noopener noreferrer" download>
                <Ico d={I.down} /> Download full document
              </a>
            </div>
          )}
        </div>

        {/* right column */}
        <div className="colR">
          <div className="statrow">
            <div className="card stat">
              <div className="cardhd"><span>Where this stands</span></div>
              <div className={'ring ' + (decision || 'none')}>
                <span>{decision ? DECIDED[decision] : 'In review'}</span>
              </div>
              <p className="statline">{decision ? STATUS[decision] : 'Read the brief, then advance, hold or pass.'}</p>
            </div>

            {visibleSignals.length > 0 && (
              <div className="card skills">
                <div className="cardhd"><span>Signal breakdown</span><em>How {first} maps to your brief</em></div>
                {visibleSignals.map((s, i) => {
                  const m = SIGNAL_META[s.score];
                  return (
                    <div className="skill" key={i}>
                      <div className="sr"><span className="sn">{s.signal}</span><span className="sv">{m.label}</span></div>
                      <div className="bar"><span style={{ width: `${m.pct}%` }} /></div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="card tabc">
            <div className="tabbar" role="tablist">
              {([['brief', 'The brief'], ['experience', 'Experience'], ['notes', 'Your notes']] as [Tab, string][]).map(([k, l]) => (
                <button key={k} role="tab" aria-selected={tab === k} className={'tb' + (tab === k ? ' on' : '')} onClick={() => setTab(k)}>
                  {l}{k === 'notes' && savedNote.trim() ? ' •' : ''}
                </button>
              ))}
            </div>

            <div className="panel">
              {tab === 'brief' && (
                <>
                  {c.headline && <h2 className="lede">{c.headline}</h2>}
                  {c.intro && <p className="intro">{c.intro}</p>}
                  {c.fitBullets.length > 0 && (
                    <>
                      <div className="secline">Why {first} fits the brief</div>
                      <ul className="fits">{c.fitBullets.map((b, i) => <li key={i}>{b}</li>)}</ul>
                    </>
                  )}
                  {c.cta && <div className="reco"><div className="rl">Our recommendation</div><p>{c.cta}</p></div>}
                </>
              )}

              {tab === 'experience' && (
                c.experience.length > 0 ? (
                  <div className="tl">
                    {c.experience.map((e, i) => (
                      <div className="job" key={i}>
                        <span className="jav">{initialsOf(e.company || e.title)}</span>
                        <div className="jb">
                          <div className="jt">{e.title}{i === 0 && <span className="cur">Most recent</span>}</div>
                          <div className="jm">{[e.company, e.period].filter(Boolean).join(' • ')}{e.location ? ` • ${e.location}` : ''}</div>
                          {e.points.length > 0 && <ul>{e.points.map((p, j) => <li key={j}>{p}</li>)}</ul>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : <p className="intro">No employment history recorded yet.</p>
              )}

              {tab === 'notes' && (
                <div className="notes">
                  <p className="intro">Anything you write here goes to the recruiter. It saves on its own — you don’t have to decide yet.</p>
                  <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder={`Your notes on ${first}…`} />
                  <div className="noterow">
                    <button className="btn go" onClick={() => send(null, note)} disabled={!noteDirty || busy === 'n'}>
                      {busy === 'n' ? 'Saving…' : noteDirty ? 'Save notes' : 'Saved'}
                    </button>
                    {savedNote.trim() && !noteDirty && <span className="hint">Your recruiter can see this.</span>}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="card journey">
            <div className="cardhd"><span>Hiring journey</span></div>
            <div className="track">
              {steps.map((s, i) => (
                <div className={'st ' + s.s} key={i}>
                  <span className="dot" />
                  <span className="l">{s.l}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
