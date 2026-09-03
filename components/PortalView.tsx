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
const CHOICES: { k: Decision; label: string; sub: string }[] = [
  { k: 'advance', label: 'Advance to interview', sub: 'Bring them in to meet the team' },
  { k: 'hold', label: 'Hold for now', sub: 'Interested, but not yet' },
  { k: 'pass', label: 'Pass', sub: 'Not the right fit for this seat' },
];
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

export function PortalView({ initial, settings, canEdit = false }: { initial: StoredCandidate[]; settings: PortalSettings; canEdit?: boolean }) {
  const [cands, setCands] = React.useState<StoredCandidate[]>(initial);
  const sorted = React.useMemo(() => [...cands].sort((a, b) => (b.fit ?? 0) - (a.fit ?? 0)), [cands]);
  const [openId, setOpenId] = React.useState<string | null>(null);
  const open = sorted.find((c) => c.id === openId) || null;

  const applyFeedback = (id: string, decision: Decision | null, note: string, clear = false) =>
    setCands((l) => l.map((c) => (c.id === id ? { ...c, decision: clear ? null : (decision ?? c.decision), note } : c)));

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
            // Keyed by id on purpose: without it, switching candidates keeps the
            // previous person's editor form and note in state, and a save would
            // write one candidate's copy onto another.
            ? <Profile key={open.id} c={open} role={role} onFeedback={applyFeedback} canEdit={canEdit}
                onSaved={(u) => setCands((l) => l.map((x) => (x.id === u.id ? u : x)))} />
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

type Tab = 'brief' | 'experience' | 'signal' | 'notes';

function Profile({ c, role, onFeedback, canEdit, onSaved }: {
  c: StoredCandidate; role: string;
  onFeedback: (id: string, d: Decision | null, n: string, clear?: boolean) => void;
  canEdit: boolean; onSaved: (c: StoredCandidate) => void;
}) {
  const [editing, setEditing] = React.useState(false);
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
    { i: I.cash, k: 'Bill rate', v: c.compExp },
    { i: I.cal, k: 'Experience', v: c.years ? `${c.years} years` : '' },
  ].filter((f) => f.v);

  const visibleSignals = c.signals.filter((s) => s.score !== 'gap');
  const noteDirty = note !== savedNote;

  const send = async (d: Decision | null, n: string, clear = false) => {
    setBusy(d || clear ? 'd' : 'n');
    await fetch(`/api/candidates/${c.id}/feedback`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ decision: d, note: n, clear }),
    }).catch(() => {});
    setBusy('');
    if (clear) setDecision(null);
    else if (d) setDecision(d);
    setSavedNote(n);
    onFeedback(c.id, clear ? null : d, n, clear);
  };

  // Clicking the answer you already gave takes it back.
  const choose = (d: Decision) => (decision === d ? send(null, note, true) : send(d, note));

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
          {CHOICES.slice().reverse().map((d) => (
            <button key={d.k}
              className={'btn' + (d.k === 'hold' ? ' ghost' : d.k === 'advance' ? ' go' : '') + (decision === d.k ? ' picked' : '')}
              disabled={busy === 'd'} onClick={() => choose(d.k)}
              title={decision === d.k ? 'Click again to undo' : undefined}>
              {decision === d.k ? '✓ ' : ''}{d.label}
            </button>
          ))}
        </div>
      </div>

      {canEdit && (
        <div className="editbar">
          <span className="only">Only you can see this — the client sees the published copy</span>
          <button className="btn" onClick={() => setEditing((v) => !v)}>{editing ? 'Close editor' : 'Edit this profile'}</button>
        </div>
      )}

      {canEdit && editing && <Editor c={c} onDone={(u) => { if (u) onSaved(u); setEditing(false); }} />}

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
            <div className="card snap">
              <div className="cardhd"><span>Snapshot</span></div>
              <div className="snapbody">
                <div className="who1">{c.role}{c.company && <em>{c.company}</em>}</div>
                {c.tags.length > 0 && (
                  <div className="chips">{c.tags.map((t, i) => <span className="chip2" key={i}>{t}</span>)}</div>
                )}
                <div className="snapstate">
                  <span className={'sdot ' + (decision || 'none')} />
                  {decision ? DECIDED[decision] : 'Awaiting your call'}
                </div>
              </div>
            </div>

            <div className="card pitch">
              <div className="cardhd"><span>Quick pitch</span><em>Why we put {first} in front of you</em></div>
              <div className="pitchbody">
                {c.headline && <p className="pline">{c.headline}</p>}
                {c.fitBullets.length > 0 && (
                  <ul className="proof">
                    {c.fitBullets.slice(0, 2).map((b, i) => <li key={i}>{b}</li>)}
                  </ul>
                )}
                <button className="readmore" onClick={() => setTab('brief')}>Read the full brief →</button>
              </div>
            </div>
          </div>

          <div className="card tabc">
            <div className="tabbar" role="tablist">
              {([['brief', 'The brief'], ['experience', 'Experience'], ['signal', 'Signal read'], ['notes', 'Your notes']] as [Tab, string][]).map(([k, l]) => (
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

              {tab === 'signal' && (
                visibleSignals.length > 0 ? (
                  <>
                    <p className="intro">How {first} maps to each thing this search is built around.</p>
                    <div className="skills-in">
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
                  </>
                ) : <p className="intro">No signal read recorded yet.</p>
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

          <div className="card callc">
            <div className="cardhd"><span>Your call</span><em>Routes straight back to the recruiter</em></div>
            <div className="opts">
              {CHOICES.map((d) => (
                <button key={d.k} className={'opt ' + d.k + (decision === d.k ? ' on' : '')}
                  disabled={busy === 'd'} onClick={() => choose(d.k)}
                  title={decision === d.k ? 'Click again to undo' : undefined}>
                  <span className="tick" />
                  <span className="ot">
                    <b>{d.label}</b>
                    <em>{d.sub}</em>
                  </span>
                </button>
              ))}
            </div>
            <p className="callfoot">
              {decision
                ? `${STATUS[decision]} Change it any time — we act on your latest answer.`
                : 'Nothing is sent until you choose. Leave a note first if you’d rather ask us something.'}
            </p>
            {decision && (
              <button className="undo" disabled={busy === 'd'} onClick={() => send(null, note, true)}>
                ← Undo — put {first} back to undecided
              </button>
            )}
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


/* ---------- edit layer (login only; never rendered for the client) ---------- */

// Size a textarea to what is actually in it, so a long list of bullets is all
// on screen rather than hidden behind a scrollbar while you edit it.
function rowsFor(v: string): number {
  const lines = v.split('\n').reduce((n, l) => n + Math.max(1, Math.ceil(l.length / 92)), 0);
  return Math.min(20, Math.max(3, lines + 1));
}

function Editor({ c, onDone }: { c: StoredCandidate; onDone: (c: StoredCandidate | null) => void }) {
  const [f, setF] = React.useState({
    name: c.name, role: c.role, company: c.company,
    years: c.years == null ? '' : String(c.years),
    location: c.location, compExp: c.compExp, avail: c.avail,
    tags: c.tags.join(', '),
    headline: c.headline, intro: c.intro,
    fitBullets: c.fitBullets.join('\n'),
    cta: c.cta,
    signals: c.signals.map((s) => `${s.signal} | ${s.score}`).join('\n'),
    resumeUrl: c.resumeUrl,
    fit: c.fit == null ? '' : String(c.fit),
  });
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState('');
  const set = (k: keyof typeof f, v: string) => setF((x) => ({ ...x, [k]: v }));

  const save = async () => {
    setBusy(true); setErr('');
    const signals = f.signals.split('\n').map((l) => l.trim()).filter(Boolean).map((l) => {
      const [sig, sc] = l.split('|').map((x) => (x || '').trim());
      return { signal: sig, score: (['strong', 'solid', 'partial', 'gap'].includes(sc) ? sc : 'solid') };
    });
    const res = await fetch(`/api/candidates/${c.id}`, {
      method: 'PUT', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ...f, signals, experience: c.experience }),
    }).catch(() => null);
    setBusy(false);
    if (!res || !res.ok) { setErr((await res?.json().catch(() => ({})))?.error || 'Could not save.'); return; }
    const { candidate } = await res.json();
    onDone(candidate);
  };

  // Deliberately a plain function, not a component: a component declared inside
  // Editor gets a fresh identity every render, so React would tear down and
  // rebuild each field on every keystroke and the caret would jump out.
  const row = (k: keyof typeof f, label: string, area = false, hint?: string) => (
    <label className="ef" key={k}>
      <span>{label}{hint && <em>{hint}</em>}</span>
      {area
        ? <textarea value={f[k]} onChange={(e) => set(k, e.target.value)} rows={rowsFor(f[k])} />
        : <input value={f[k]} onChange={(e) => set(k, e.target.value)} />}
    </label>
  );

  return (
    <div className="card editor">
      <div className="cardhd"><span>Edit the client-facing copy</span><em>Saves to the portal immediately</em></div>
      <div className="ebody">
        <div className="ecols">
          {row('name', 'Name')}
          {row('role', 'Current title')}
          {row('company', 'Company')}
          {row('years', 'Years of experience')}
          {row('location', 'Location')}
          {row('avail', 'Availability')}
          {row('compExp', 'Bill rate')}
          {row('resumeUrl', 'Résumé URL')}
          {row('fit', 'Sort rank', false, 'orders the shortlist; not shown')}
        </div>
        {row('tags', 'Snapshot chips', true, 'comma separated')}
        {row('headline', 'Headline / quick pitch', true)}
        {row('intro', 'Opening paragraph', true)}
        {row('fitBullets', 'Why they fit', true, 'one per line')}
        {row('cta', 'Our recommendation', true)}
        {row('signals', 'Signal read', true, 'one per line — Label | strong / solid / partial / gap')}
        {err && <div className="eerr">{err}</div>}
        <div className="erow">
          <button className="btn go" disabled={busy} onClick={save}>{busy ? 'Saving…' : 'Save and publish'}</button>
          <button className="btn" disabled={busy} onClick={() => onDone(null)}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
