'use client';
/* ============================================================
   Spyglass Matrix — client-facing portal (DB-backed)
   The single surface the client sees: an editorial shortlist of
   the candidates the recruiter added, each opening into a brief +
   signal map + an Advance / Hold / Pass decision that persists.

   Styling is the black / white / maroon editorial treatment,
   namespaced .pv in globals.css — one accent, rules and space
   instead of nested cards. Internal surfaces are untouched.
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

export function PortalView({ initial, settings }: { initial: StoredCandidate[]; settings: PortalSettings }) {
  const [cands, setCands] = React.useState<StoredCandidate[]>(initial);
  const [openId, setOpenId] = React.useState<string | null>(null);
  const open = cands.find((c) => c.id === openId) || null;

  const applyFeedback = (id: string, decision: Decision, note: string) =>
    setCands((l) => l.map((c) => (c.id === id ? { ...c, decision, note } : c)));

  const client = settings.clientName.trim();

  return (
    <div className="pv">
      <div className="top">
        <div className="top-in">
          <span className="wordmark">Spyglass <b>Matrix</b></span>
          <span className="sep" />
          <span className="conf">
            {client ? `For ${client}` : 'Private'} &nbsp;·&nbsp; Confidential
          </span>
        </div>
      </div>

      {open ? (
        <ExpandedDossier c={open} onBack={() => { setOpenId(null); window.scrollTo(0, 0); }} onFeedback={applyFeedback} />
      ) : (
        <Shortlist cands={cands} settings={settings} onOpen={(id) => { setOpenId(id); window.scrollTo(0, 0); }} />
      )}
    </div>
  );
}

function Shortlist({ cands, settings, onOpen }: { cands: StoredCandidate[]; settings: PortalSettings; onOpen: (id: string) => void }) {
  const sorted = [...cands].sort((a, b) => (b.fit ?? 0) - (a.fit ?? 0));
  const client = settings.clientName.trim();
  const role = settings.roleLabel.trim();

  return (
    <div className="sl">
      <header>
        <div className="kick"><span className="bar" /><span className="t">The shortlist</span></div>
        <h1>
          {role || 'Your shortlist'}
          {client && <> <em>//</em> {client}</>}
        </h1>
        <p className="sub">
          {sorted.length > 0
            ? 'Built against your real hiring needs — not just the job description. Review each candidate and move forward, pass, or give us direction in real time.'
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
        <p className="note">
          Held in confidence between you and Spyglass · Internal screening notes are not included in this view
        </p>
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

      {c.tags.length > 0 && (
        <div className="tags">{c.tags.map((t, i) => <span className="tg" key={i}>{t}</span>)}</div>
      )}

      <div className="ft">
        {c.decision ? <span className="said">{DECIDED[c.decision]}</span> : <span />}
        <span className="go">Open dossier →</span>
      </div>
    </button>
  );
}

function ExpandedDossier({ c, onBack, onFeedback }: { c: StoredCandidate; onBack: () => void; onFeedback: (id: string, d: Decision, n: string) => void }) {
  const [decision, setDecision] = React.useState<Decision | null>(c.decision);
  const [note, setNote] = React.useState(c.note || '');
  const [submitted, setSubmitted] = React.useState(!!c.decision);
  const [saving, setSaving] = React.useState(false);
  const first = c.name.split(' ')[0];

  const meta = [
    { l: 'Current', v: [c.role, c.company].filter(Boolean).join(', ') },
    { l: 'Experience', v: c.years ? `${c.years} years` : '' },
    { l: 'Location', v: c.location },
    { l: 'Compensation', v: c.compExp },
    { l: 'Availability', v: c.avail },
  ].filter((x) => x.v);

  // Gaps stay out of the client's view.
  const visibleSignals = c.signals.filter((s) => s.score !== 'gap');

  const submit = async () => {
    if (!decision) return;
    setSaving(true);
    await fetch(`/api/candidates/${c.id}/feedback`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ decision, note }),
    });
    setSaving(false);
    setSubmitted(true);
    onFeedback(c.id, decision, note);
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  };

  const toDecision = () => {
    const el = document.getElementById('decision-panel');
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 24, behavior: 'smooth' });
  };

  const decisions: { k: Decision; label: string; sub: string }[] = [
    { k: 'advance', label: 'Advance to interview', sub: 'Bring them in to meet the team' },
    { k: 'hold', label: 'Hold for now', sub: 'Interested, but not yet' },
    { k: 'pass', label: 'Pass', sub: 'Not the right fit' },
  ];

  return (
    <>
      <div className="shell">
        <aside className="rail">
          <button className="back" onClick={onBack}>← Shortlist</button>
          <div className="mark">{initialsOf(c.name)}</div>
          <h1>{c.name}</h1>
          {(c.role || c.company) && <div className="at">{[c.role, c.company].filter(Boolean).join(' · ')}</div>}

          <div className="hr" />

          {meta.length > 0 && (
            <div className="meta">
              {meta.map((it, i) => (
                <div key={i}><div className="k">{it.l}</div><div className="v">{it.v}</div></div>
              ))}
            </div>
          )}

          {submitted && decision && <div className="status">{DECIDED[decision]}</div>}
        </aside>

        <main className="read">
          <div className="kick"><span className="bar" /><span className="t">Candidate brief</span></div>

          {c.headline && <h2 className="lede">{c.headline}</h2>}
          {c.intro && <p className="intro">{c.intro}</p>}

          {c.fitBullets.length > 0 && (
            <section>
              <div className="kick sec"><span className="bar" /><span className="t">01 · Why {first} fits the brief</span></div>
              <ul className="fits">{c.fitBullets.map((b, i) => <li key={i}>{b}</li>)}</ul>
            </section>
          )}

          {visibleSignals.length > 0 && (
            <section>
              <div className="kick sec"><span className="bar" /><span className="t">02 · How {first} maps to your brief</span></div>
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
            </section>
          )}

          {c.experience.length > 0 && (
            <section>
              <div className="kick sec"><span className="bar" /><span className="t">03 · Employment history</span></div>
              {c.experience.map((e, i) => (
                <div className="job" key={i}>
                  <div className="jh">
                    <div className="ti">{e.title}{e.company && <span> · {e.company}</span>}</div>
                    {(e.period || e.location) && <div className="pd">{[e.period, e.location].filter(Boolean).join(' · ')}</div>}
                  </div>
                  {e.points.length > 0 && <ul>{e.points.map((p, j) => <li key={j}>{p}</li>)}</ul>}
                </div>
              ))}
              {c.resumeUrl && (
                <a className="res" href={c.resumeUrl} target="_blank" rel="noopener noreferrer" download>
                  Download {first}’s résumé <span className="x">PDF</span>
                </a>
              )}
            </section>
          )}

          {!c.experience.length && c.resumeUrl && (
            <a className="res" href={c.resumeUrl} target="_blank" rel="noopener noreferrer" download>
              Download {first}’s résumé <span className="x">PDF</span>
            </a>
          )}
        </main>
      </div>

      {c.cta && (
        <div className="band">
          <div className="band-in">
            <div className="kick"><span className="bar" /><span className="t">Recommendation</span></div>
            <div className="row">
              <p className="rec">{c.cta}</p>
              <button className="cta" onClick={toDecision}>Make your decision →</button>
            </div>
          </div>
        </div>
      )}

      <div className="dec" id="decision-panel">
        {!submitted ? (
          <>
            <div className="kick"><span className="bar" /><span className="t">Your call</span></div>
            <h3>Where should we take {first}?</h3>
            <p className="lede2">Your decision routes straight back to the recruiter.</p>
            <div className="opts">
              {decisions.map((d) => (
                <button key={d.k} className={'opt' + (decision === d.k ? ' on' : '')} onClick={() => setDecision(d.k)}>
                  <div className="l">{d.label}</div>
                  <div className="s">{d.sub}</div>
                </button>
              ))}
            </div>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a note for the recruiter (optional)…" />
            <button className="send" onClick={submit} disabled={!decision || saving}>
              {saving ? 'Sending…' : 'Send to Spyglass →'}
            </button>
          </>
        ) : (
          <div className="doneblk">
            <div className="kick"><span className="bar" /><span className="t">Sent</span></div>
            <h3>
              {decision === 'advance' ? `The recruiter knows — ${first} is moving forward.`
                : decision === 'hold' ? `Noted. We’ll keep ${first} warm.`
                : 'Understood. We’ll keep looking.'}
            </h3>
            <p className="q">{note ? `“${note}”` : 'Your decision is now on the recruiter’s desk.'}</p>
            <button className="again" onClick={() => setSubmitted(false)}>Change response</button>
          </div>
        )}
      </div>
    </>
  );
}
