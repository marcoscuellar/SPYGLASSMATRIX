'use client';
/* ============================================================
   Spyglass Matrix — client-facing portal (DB-backed)
   The single surface the client sees. The dossier is a workspace,
   not a scroll: identity rail, status + signal tiles, tabbed
   panels (brief / experience / the client's own notes), and a
   stage strip — all inside the black / white / maroon editorial
   treatment namespaced .pv in globals.css.
   ============================================================ */
import React from 'react';
import type { Decision, PortalSettings, ScoreKey, StoredCandidate } from '@/lib/types';

function initialsOf(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((s) => s[0]?.toUpperCase() || '').join('') || '—';
}

// Three-segment meter: how many segments each score fills, and its label.
const SIGNAL_META: Record<ScoreKey, { dots: number; label: string }> = {
  strong: { dots: 3, label: 'Strong' },
  solid: { dots: 2, label: 'Solid' },
  partial: { dots: 1, label: 'Partial' },
  gap: { dots: 0, label: 'Gap' },
};

const DECIDED: Record<Decision, string> = {
  advance: 'You advanced',
  hold: 'On hold',
  pass: 'Passed',
};

// The tile beside the signal read: where this candidate actually stands.
const STATUS: Record<Decision, { word: string; line: string }> = {
  advance: { word: 'Advanced', line: 'We’re setting up the interview and will confirm times with you.' },
  hold: { word: 'On hold', line: 'Kept warm. Tell us when you want to revisit.' },
  pass: { word: 'Passed', line: 'Noted — we’ll keep looking and come back with more.' },
};

export function PortalView({ initial, settings }: { initial: StoredCandidate[]; settings: PortalSettings }) {
  const [cands, setCands] = React.useState<StoredCandidate[]>(initial);
  const [openId, setOpenId] = React.useState<string | null>(null);
  const open = cands.find((c) => c.id === openId) || null;

  const applyFeedback = (id: string, decision: Decision | null, note: string) =>
    setCands((l) => l.map((c) => (c.id === id ? { ...c, decision: decision ?? c.decision, note } : c)));

  const client = settings.clientName.trim();

  return (
    <div className="pv">
      <div className="top">
        <div className="top-in">
          <span className="wordmark">Spyglass <b>Matrix</b></span>
          <span className="sep" />
          <span className="conf">{client ? `For ${client}` : 'Private'} &nbsp;·&nbsp; Confidential</span>
        </div>
      </div>

      {open ? (
        <Dossier
          c={open}
          roleLabel={settings.roleLabel.trim()}
          onBack={() => { setOpenId(null); window.scrollTo(0, 0); }}
          onFeedback={applyFeedback}
        />
      ) : (
        <Shortlist cands={cands} settings={settings} onOpen={(id) => { setOpenId(id); window.scrollTo(0, 0); }} />
      )}
    </div>
  );
}

/* ---------------------------------------------------------- shortlist */

function Shortlist({ cands, settings, onOpen }: { cands: StoredCandidate[]; settings: PortalSettings; onOpen: (id: string) => void }) {
  const sorted = [...cands].sort((a, b) => (b.fit ?? 0) - (a.fit ?? 0));
  const client = settings.clientName.trim();
  const role = settings.roleLabel.trim();

  return (
    <div className="sl">
      <header>
        <div className="kick"><span className="bar" /><span className="t">The shortlist</span></div>
        <h1>{role || 'Your shortlist'}{client && <> <em>//</em> {client}</>}</h1>
        <p className="sub">
          {sorted.length > 0
            ? 'Built against your real hiring needs — not just the job description. Open a candidate to read the brief, work through their experience, and leave us your notes.'
            : 'Your shortlist is being prepared. Candidates will appear here as soon as they’re ready for your review.'}
        </p>
      </header>

      {sorted.length === 0 ? (
        <div className="empty">No candidates presented yet. Check back shortly.</div>
      ) : (
        <div className="deck">
          {sorted.map((c, i) => <PortalCard key={c.id} c={c} rank={i + 1} onOpen={() => onOpen(c.id)} />)}
        </div>
      )}

      {sorted.length > 0 && (
        <p className="note">Held in confidence between you and Spyglass · Internal screening notes are not included in this view</p>
      )}
    </div>
  );
}

function PortalCard({ c, rank, onOpen }: { c: StoredCandidate; rank: number; onOpen: () => void }) {
  return (
    <button className="pc" onClick={onOpen}>
      <div className="hd">
        <div>
          <div className="nm">{c.name}</div>
          <div className="rl">{[c.role, c.years ? `${c.years} yrs` : ''].filter(Boolean).join(' · ')}</div>
        </div>
        <span className="rk">{String(rank).padStart(2, '0')}</span>
      </div>
      {c.headline && <p className="hl">{c.headline}</p>}
      {c.tags.length > 0 && <div className="tags">{c.tags.map((t, i) => <span className="tg" key={i}>{t}</span>)}</div>}
      <div className="ft">
        {c.decision ? <span className="said">{DECIDED[c.decision]}</span> : <span />}
        <span className="go">Open dossier →</span>
      </div>
    </button>
  );
}

/* ---------------------------------------------------------- dossier */

type Tab = 'brief' | 'experience' | 'notes';

function Dossier({ c, roleLabel, onBack, onFeedback }: {
  c: StoredCandidate;
  roleLabel: string;
  onBack: () => void;
  onFeedback: (id: string, d: Decision | null, n: string) => void;
}) {
  const [tab, setTab] = React.useState<Tab>('brief');
  const [decision, setDecision] = React.useState<Decision | null>(c.decision);
  const [note, setNote] = React.useState(c.note || '');
  const [savedNote, setSavedNote] = React.useState(c.note || '');
  const [busy, setBusy] = React.useState<'' | 'decision' | 'note'>('');
  const first = c.name.split(' ')[0];

  const meta = [
    { l: 'Experience', v: c.years ? `${c.years} years` : '' },
    { l: 'Location', v: c.location },
    { l: 'Compensation', v: c.compExp },
    { l: 'Availability', v: c.avail },
  ].filter((x) => x.v);

  // Gaps stay out of the client's view.
  const visibleSignals = c.signals.filter((s) => s.score !== 'gap');

  const send = async (d: Decision | null, n: string) => {
    setBusy(d ? 'decision' : 'note');
    await fetch(`/api/candidates/${c.id}/feedback`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ decision: d, note: n }),
    }).catch(() => {});
    setBusy('');
    if (d) setDecision(d);
    setSavedNote(n);
    onFeedback(c.id, d, n);
  };

  const decisions: { k: Decision; label: string }[] = [
    { k: 'pass', label: 'Pass' },
    { k: 'hold', label: 'Hold' },
    { k: 'advance', label: 'Advance to interview' },
  ];

  const noteDirty = note !== savedNote;
  const stages = [
    { l: 'Submitted', done: true },
    { l: 'Your review', done: true },
    { l: decision ? STATUS[decision].word : 'Your decision', done: !!decision },
  ];

  return (
    <div className="dsr">
      {/* action bar */}
      <div className="dtop">
        <div className="dtop-in">
          <div className="who">
            <button className="back" onClick={onBack}>← Shortlist</button>
            <div className="crumb">Candidates › {roleLabel || 'Shortlist'} › Profile</div>
            <div className="nameline">
              <h1>{c.name}</h1>
              <span className={'pill' + (decision ? ' ' + decision : '')}>
                {decision ? STATUS[decision].word : 'Awaiting your call'}
              </span>
            </div>
            <div className="subline">{[c.role, c.company].filter(Boolean).join(' · ')}</div>
          </div>
          <div className="acts">
            {decisions.map((d) => (
              <button
                key={d.k}
                className={'act ' + d.k + (decision === d.k ? ' on' : '')}
                disabled={busy === 'decision'}
                onClick={() => send(d.k, note)}
              >{decision === d.k ? '✓ ' : ''}{d.label}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="dgrid">
        {/* identity rail */}
        <aside className="idcard">
          <div className="mark">{initialsOf(c.name)}</div>
          <div className="nm">{c.name}</div>
          <div className="ttl">{[c.role, c.company].filter(Boolean).join(' · ')}</div>

          {meta.length > 0 && (
            <div className="fields">
              {meta.map((it, i) => (
                <div className="f" key={i}><div className="k">{it.l}</div><div className="v">{it.v}</div></div>
              ))}
            </div>
          )}

          {c.resumeUrl && (
            <div className="resblock">
              <div className="cardhd"><span className="t">Résumé</span></div>
              <a className="res" href={c.resumeUrl} target="_blank" rel="noopener noreferrer" download>
                Download {first}’s résumé <span className="x">↓</span>
              </a>
            </div>
          )}
        </aside>

        {/* working column */}
        <main className="dmain">
          <div className="tiles">
            {visibleSignals.length > 0 && (
              <div className="tile signals">
                <div className="cardhd">
                  <span className="t">Signal read</span>
                  <span className="hint">{decision ? STATUS[decision].line : 'How she maps to your brief'}</span>
                </div>
                {visibleSignals.map((s, i) => {
                  const m = SIGNAL_META[s.score];
                  return (
                    <div className="sig" key={i}>
                      <span className="lab">{s.signal}</span>
                      <span className="meter">{[0, 1, 2].map((j) => <i key={j} className={j < m.dots ? 'on' : ''} />)}</span>
                      <span className="sc">{m.label}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="tabcard">
          <div className="tabbar" role="tablist">
            {([['brief', 'The brief'], ['experience', 'Experience'], ['notes', 'Your notes']] as [Tab, string][]).map(([k, l]) => (
              <button key={k} role="tab" aria-selected={tab === k} className={'tb' + (tab === k ? ' on' : '')} onClick={() => setTab(k)}>
                {l}{k === 'notes' && savedNote.trim() ? ' ·' : ''}
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
              c.experience.length > 0 ? c.experience.map((e, i) => (
                <div className="job" key={i}>
                  <div className="jh">
                    <div className="ti">{e.title}{e.company && <span> · {e.company}</span>}</div>
                    {(e.period || e.location) && <div className="pd">{[e.period, e.location].filter(Boolean).join(' · ')}</div>}
                  </div>
                  {e.points.length > 0 && <ul>{e.points.map((p, j) => <li key={j}>{p}</li>)}</ul>}
                </div>
              )) : <p className="intro">No employment history recorded yet.</p>
            )}

            {tab === 'notes' && (
              <div className="notes">
                <p className="intro">
                  Anything you write here goes to the recruiter — questions, reservations, who else should meet
                  {' '}{first}. It saves on its own; you don’t have to decide yet.
                </p>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={`Your notes on ${first}…`}
                />
                <div className="noterow">
                  <button className="save" onClick={() => send(null, note)} disabled={!noteDirty || busy === 'note'}>
                    {busy === 'note' ? 'Saving…' : noteDirty ? 'Save notes' : 'Saved'}
                  </button>
                  {savedNote.trim() && !noteDirty && <span className="hint">Your recruiter can see this.</span>}
                </div>
              </div>
            )}
          </div>
          </div>

          <div className="journey">
            <div className="cardhd"><span className="t">Where {first} is</span></div>
            <div className="track">
              {stages.map((s, i) => (
                <div className={'st' + (s.done ? ' done' : '')} key={i}>
                  <span className="dot" />
                  <span className="l">{s.l}</span>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
