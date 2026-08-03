'use client';
/* ============================================================
   Spyglass Matrix — client-facing portal (DB-backed)
   The single surface the client sees: an editorial shortlist of
   the candidates the recruiter added, each opening into a brief +
   signal map + an Advance / Hold / Pass decision that persists.
   ============================================================ */
import React from 'react';
import { Avatar, Button, Eyebrow, FitChip, Mark, Tag } from './ui';
import { Arrow, CheckIcon, SparkIcon } from './icons';
import { SCORE_META } from '@/lib/data';
import type { Decision, PortalSettings, StoredCandidate } from '@/lib/types';

function initialsOf(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((s) => s[0]?.toUpperCase() || '').join('') || '—';
}

// Single brand accent — navy. (Gold is used sparingly for top fit scores.)
const ACCENT = 'var(--navy)';

export function PortalView({ initial, settings }: { initial: StoredCandidate[]; settings: PortalSettings }) {
  const [cands, setCands] = React.useState<StoredCandidate[]>(initial);
  const [openId, setOpenId] = React.useState<string | null>(null);
  const open = cands.find((c) => c.id === openId) || null;

  const applyFeedback = (id: string, decision: Decision, note: string) =>
    setCands((l) => l.map((c) => (c.id === id ? { ...c, decision, note } : c)));

  if (open) {
    return <ExpandedDossier c={open} onBack={() => { setOpenId(null); window.scrollTo(0, 0); }} onFeedback={applyFeedback} />;
  }
  return <Shortlist cands={cands} settings={settings} onOpen={(id) => { setOpenId(id); window.scrollTo(0, 0); }} />;
}

function Shortlist({ cands, settings, onOpen }: { cands: StoredCandidate[]; settings: PortalSettings; onOpen: (id: string) => void }) {
  const sorted = [...cands].sort((a, b) => (b.fit ?? 0) - (a.fit ?? 0));
  const client = settings.clientName.trim();
  const role = settings.roleLabel.trim();
  const firstName = client.split(/\s+/)[0];
  const headline = role && client ? `${role} // ${client}` : client ? `${firstName}, your shortlist.` : 'Your shortlist.';
  return (
    <div style={{ minHeight: '100vh', background: 'var(--paper)' }}>
      <div style={{ maxWidth: 1060, margin: '0 auto', padding: '0 clamp(20px, 5vw, 40px) 110px' }}>
        <header style={{ padding: 'clamp(40px, 8vw, 64px) 0 40px', borderBottom: '1px solid var(--line)', marginBottom: 48 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 30, flexWrap: 'wrap' }}>
            <Mark variant="navy" size={26} />
            <span className="t-mono-tag" style={{ color: 'var(--navy)' }}>PREPARED BY SPYGLASS</span>
            {client && <>
              <span style={{ width: 18, height: 1, background: 'var(--line)' }} />
              <span className="t-mono-tag" style={{ color: 'var(--ink-2)' }}>FOR {client.toUpperCase()}</span>
            </>}
            <span style={{ width: 18, height: 1, background: 'var(--line)' }} />
            <span className="t-mono-tag" style={{ color: 'var(--ink-3)' }}>CONFIDENTIAL</span>
          </div>
          <h1 style={{ fontFamily: 'var(--font)', fontWeight: 800, fontSize: 'clamp(38px, 5.4vw, 64px)', letterSpacing: '-0.04em', lineHeight: 1.02, margin: '0 0 22px', maxWidth: '18ch' }}>
            {headline}
          </h1>
          <p className="t-body" style={{ color: 'var(--ink-2)', fontSize: 19.5, maxWidth: '62ch', margin: 0 }}>
            {sorted.length > 0
              ? 'Built against your real hiring needs — not just the job description. Review each candidate and move forward, pass, or give us direction in real time.'
              : 'Your shortlist is being prepared. Candidates will appear here as soon as they’re ready for your review.'}
          </p>
        </header>

        {sorted.length === 0 ? (
          <div style={{ padding: '70px 40px', textAlign: 'center', border: '1px dashed var(--line)', borderRadius: 'var(--r-6)', background: 'var(--bg-card)' }}>
            <div style={{ display: 'inline-flex', marginBottom: 16, opacity: 0.5 }}><Mark variant="navy" size={34} /></div>
            <p className="t-body" style={{ color: 'var(--ink-3)', maxWidth: '40ch', margin: '0 auto' }}>No candidates presented yet. Check back shortly.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: 22 }}>
            {sorted.map((c, i) => <PortalCard key={c.id} c={c} rank={i + 1} onOpen={() => onOpen(c.id)} />)}
          </div>
        )}

        {sorted.length > 0 && (
          <p className="t-body" style={{ color: 'var(--ink-3)', fontSize: 15, textAlign: 'center', marginTop: 44 }}>
            Held in confidence between you and Spyglass. Internal screening notes are not included in this view.
          </p>
        )}
      </div>
    </div>
  );
}

const fbMetaFor = (d: Decision) => ({
  advance: { t: 'You advanced', tone: 'live' as const },
  hold: { t: 'On hold', tone: 'amber' as const },
  pass: { t: 'Passed', tone: 'pipeline' as const },
}[d]);

function PortalCard({ c, rank, onOpen }: { c: StoredCandidate; rank: number; onOpen: () => void }) {
  const [hover, setHover] = React.useState(false);
  const fb = c.decision ? fbMetaFor(c.decision) : null;
  const accent = ACCENT;
  return (
    <div onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} onClick={onOpen}
      style={{ background: 'var(--bg-card)', border: '1px solid var(--line)', borderRadius: 'var(--r-6)', padding: 30, cursor: 'pointer', position: 'relative', overflow: 'hidden',
        boxShadow: hover ? 'var(--sh-hover)' : 'var(--sh-card)', transform: hover ? 'translateY(-3px)' : 'none', transition: 'all .25s var(--ease)', display: 'flex', flexDirection: 'column' }}>
      <span style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'var(--amber)' }} />
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Avatar initials={initialsOf(c.name)} size={50} accent={accent} />
          <div>
            <div style={{ fontFamily: 'var(--font)', fontWeight: 800, fontSize: 22.5, letterSpacing: '-0.03em', lineHeight: 1.1 }}>{c.name}</div>
            <div className="t-body" style={{ color: 'var(--ink-3)', fontSize: 14.5 }}>{[c.role, c.years ? `${c.years} yrs` : ''].filter(Boolean).join(' · ')}</div>
          </div>
        </div>
        <span className="t-mono-xs" style={{ color: 'var(--amber-dd)', fontWeight: 600 }}>{String(rank).padStart(2, '0')}</span>
      </div>
      {c.headline && <p className="t-body" style={{ color: 'var(--ink)', fontSize: 17.5, fontWeight: 500, margin: '0 0 16px', letterSpacing: '-0.01em', minHeight: 48 }}>{c.headline}</p>}
      {c.tags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 22 }}>
          {c.tags.map((t, i) => <Tag key={i} tone="amber">{t}</Tag>)}
        </div>
      )}
      <div style={{ marginTop: 'auto', paddingTop: 18, borderTop: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {fb ? <Tag tone={fb.tone}>{fb.t}</Tag> : <FitChip fit={c.fit} size="lg" />}
        <span className="t-mono-xs" style={{ color: hover ? accent : 'var(--ink-3)', display: 'inline-flex', alignItems: 'center', gap: 6, transition: 'color .2s' }}>
          OPEN DOSSIER <Arrow s={12} />
        </span>
      </div>
    </div>
  );
}

function ExpandedDossier({ c, onBack, onFeedback }: { c: StoredCandidate; onBack: () => void; onFeedback: (id: string, d: Decision, n: string) => void }) {
  const [decision, setDecision] = React.useState<Decision | null>(c.decision);
  const [note, setNote] = React.useState(c.note || '');
  const [submitted, setSubmitted] = React.useState(!!c.decision);
  const [saving, setSaving] = React.useState(false);
  const first = c.name.split(' ')[0];
  const accent = ACCENT;

  const meta = [
    { l: 'Current', v: [c.role, c.company].filter(Boolean).join(', ') },
    { l: 'Experience', v: c.years ? `${c.years} years` : '' },
    { l: 'Location', v: c.location },
    { l: 'Comp expectation', v: c.compExp },
    { l: 'Availability', v: c.avail },
  ].filter((x) => x.v);

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

  const decisions: { k: Decision; label: string; sub: string }[] = [
    { k: 'advance', label: 'Advance to interview', sub: 'Bring them in to meet the team' },
    { k: 'hold', label: 'Hold for now', sub: 'Interested, but not yet' },
    { k: 'pass', label: 'Pass', sub: 'Not the right fit' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--paper)' }}>
      <div style={{ maxWidth: 880, margin: '0 auto', padding: '36px clamp(18px, 5vw, 40px) 110px' }}>
        <button onClick={onBack} className="t-mono-xs" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3)', display: 'inline-flex', alignItems: 'center', gap: 7, marginBottom: 28, padding: 0 }}>
          <span style={{ transform: 'rotate(180deg)', display: 'inline-flex' }}><Arrow s={12} /></span> BACK TO SHORTLIST
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 30, paddingBottom: 28, borderBottom: '1px solid var(--line)' }}>
          <Avatar initials={initialsOf(c.name)} size={62} accent={accent} />
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <h1 style={{ fontFamily: 'var(--font)', fontWeight: 800, fontSize: 'clamp(28px, 7vw, 36.5px)', letterSpacing: '-0.035em', margin: 0 }}>{c.name}</h1>
              <FitChip fit={c.fit} size="lg" />
            </div>
            {(c.role || c.company) && <div className="t-body" style={{ color: 'var(--ink-2)', fontSize: 16.5, marginTop: 4 }}>{[c.role, c.company].filter(Boolean).join(' · ')}</div>}
          </div>
        </div>

        {meta.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 1, background: 'var(--line)', border: '1px solid var(--line)', borderRadius: 'var(--r-4)', overflow: 'hidden', marginBottom: 34 }}>
            {meta.map((it, i) => (
              <div key={i} style={{ background: 'var(--bg-card)', padding: '14px 16px' }}>
                <div className="t-mono-xs" style={{ color: 'var(--ink-3)', marginBottom: 6 }}>{it.l}</div>
                <div style={{ fontFamily: 'var(--font)', fontSize: 15, fontWeight: 500, color: 'var(--ink)' }}>{it.v}</div>
              </div>
            ))}
          </div>
        )}

        {/* Brief */}
        {(c.headline || c.intro || c.fitBullets.length > 0) && (
          <div style={{ border: '1px solid var(--line)', borderRadius: 'var(--r-7)', overflow: 'hidden', background: 'var(--bg-card)', boxShadow: 'var(--sh-card)', marginBottom: 34 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '15px 22px', borderBottom: '1px solid var(--line)', background: 'var(--paper)', borderTop: `3px solid ${accent}` }}>
              <SparkIcon c={accent} />
              <span className="t-mono-tag" style={{ color: accent }}>SPYGLASS · CANDIDATE BRIEF</span>
            </div>
            <div style={{ padding: 'clamp(20px, 5vw, 30px)' }}>
              {c.headline && <h3 style={{ fontFamily: 'var(--font)', fontWeight: 800, fontSize: 'clamp(21px, 5vw, 27px)', letterSpacing: '-0.03em', lineHeight: 1.16, margin: '0 0 14px' }}>{c.headline}</h3>}
              {c.intro && <p className="t-body" style={{ color: 'var(--ink-2)', fontSize: 18.5, margin: '0 0 28px', maxWidth: '62ch' }}>{c.intro}</p>}
              {c.fitBullets.length > 0 && (
                <>
                  <div className="t-mono-xs t-section-label" style={{ marginBottom: 16 }}>WHY {first.toUpperCase()} FITS THE BRIEF</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 13, marginBottom: c.cta ? 30 : 0 }}>
                    {c.fitBullets.map((b, i) => (
                      <div key={i} style={{ display: 'flex', gap: 13, alignItems: 'flex-start' }}>
                        <span style={{ width: 25, height: 25, borderRadius: 99, background: accent, display: 'grid', placeItems: 'center', flexShrink: 0, marginTop: 1 }}><CheckIcon c="#fff" /></span>
                        <span className="t-body" style={{ fontSize: 17, color: 'var(--ink)', lineHeight: 1.5 }}>{b}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
              {c.cta && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap', padding: '22px 26px', borderRadius: 'var(--r-5)', background: accent }}>
                  <p style={{ margin: 0, fontFamily: 'var(--font)', fontWeight: 600, fontSize: 18, lineHeight: 1.45, letterSpacing: '-0.01em', color: '#fff', maxWidth: '46ch' }}>{c.cta}</p>
                  <Button onClick={() => { const el = document.getElementById('decision-panel'); if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 24, behavior: 'smooth' }); }} icon={<Arrow />} style={{ background: 'var(--amber)', color: '#2a2008', borderColor: 'var(--amber)', flexShrink: 0 }}>Make your decision</Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Signal map */}
        {visibleSignals.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <div className="t-mono-xs" style={{ color: 'var(--ink-3)', marginBottom: 6 }}>HOW THEY MAP TO YOUR BRIEF</div>
            <div>
              {visibleSignals.map((s, i) => {
                const m = SCORE_META[s.score];
                return (
                  <div key={i} style={{ padding: '15px 0', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14 }}>
                    <span style={{ fontFamily: 'var(--font)', fontWeight: 600, fontSize: 17, letterSpacing: '-0.01em' }}>{s.signal}</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                      <span style={{ display: 'inline-flex', gap: 3 }}>
                        {[0, 1, 2].map((j) => <span key={j} style={{ width: 7, height: 7, borderRadius: 99, background: j < m.dots ? m.color : 'var(--ink-4)' }} />)}
                      </span>
                      <span className="t-mono-xs" style={{ color: m.color, minWidth: 44, textAlign: 'right' }}>{m.label}</span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Employment history */}
        {c.experience.length > 0 && (
          <div style={{ marginTop: 40 }}>
            <div className="t-mono-xs" style={{ color: 'var(--ink-3)', marginBottom: 6 }}>EMPLOYMENT HISTORY</div>
            <div>
              {c.experience.map((e, i) => (
                <div key={i} style={{ padding: '18px 0', borderTop: i === 0 ? '1px solid var(--line)' : 'none', borderBottom: '1px solid var(--line)' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
                    <div style={{ fontFamily: 'var(--font)', fontWeight: 700, fontSize: 17.5, letterSpacing: '-0.01em' }}>
                      {e.title}
                      {e.company && <span style={{ color: 'var(--ink-2)', fontWeight: 500 }}>{` · ${e.company}`}</span>}
                    </div>
                    {(e.period || e.location) && (
                      <span className="t-mono-xs" style={{ color: 'var(--ink-3)', flexShrink: 0 }}>{[e.period, e.location].filter(Boolean).join(' · ')}</span>
                    )}
                  </div>
                  {e.points.length > 0 && (
                    <ul style={{ margin: '9px 0 0', paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 5 }}>
                      {e.points.map((p, j) => (
                        <li key={j} className="t-body" style={{ fontSize: 15.5, color: 'var(--ink-2)', lineHeight: 1.5 }}>{p}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Résumé download */}
        {c.resumeUrl && (
          <div style={{ marginTop: 26, display: 'flex', justifyContent: 'flex-start' }}>
            <a href={c.resumeUrl} target="_blank" rel="noopener noreferrer" download
              style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none',
                padding: '12px 20px', borderRadius: 'var(--r-4)', border: '1px solid var(--line)',
                background: 'var(--bg-card)', color: 'var(--ink)', fontFamily: 'var(--font)', fontWeight: 600, fontSize: 15,
                boxShadow: 'var(--sh-card)', transition: 'all .2s var(--ease)' }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M8 1v9m0 0L4.5 6.5M8 10l3.5-3.5M2.5 12.5V14h11v-1.5" stroke="var(--navy)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Download {c.name.split(' ')[0]}’s résumé
              <span className="t-mono-xs" style={{ color: 'var(--ink-3)', fontWeight: 500 }}>PDF</span>
            </a>
          </div>
        )}

        {/* Decision */}
        <div id="decision-panel" style={{ marginTop: 48, padding: 'clamp(22px, 5vw, 32px)', borderRadius: 'var(--r-7)', background: 'var(--navy)', color: '#fff' }}>
          {!submitted ? (
            <>
              <Eyebrow style={{ color: 'var(--navy-fade)', marginBottom: 14 }}>YOUR CALL</Eyebrow>
              <h3 style={{ fontFamily: 'var(--font)', fontWeight: 700, fontSize: 25.5, letterSpacing: '-0.03em', margin: '0 0 6px', color: '#fff' }}>Where should we take {first}?</h3>
              <p className="t-body" style={{ color: 'rgba(255,255,255,0.7)', margin: '0 0 24px' }}>Your decision routes straight back to the recruiter.</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 20 }}>
                {decisions.map((d) => {
                  const on = decision === d.k;
                  return (
                    <button key={d.k} onClick={() => setDecision(d.k)}
                      style={{ textAlign: 'left', padding: '16px 18px', borderRadius: 'var(--r-4)', cursor: 'pointer', backgroundColor: on ? '#fff' : 'rgba(255,255,255,0.06)', border: `1px solid ${on ? '#fff' : 'rgba(255,255,255,0.18)'}` }}>
                      <div style={{ fontFamily: 'var(--font)', fontWeight: 700, fontSize: 16.5, color: on ? 'var(--navy)' : '#fff', marginBottom: 4 }}>{d.label}</div>
                      <div className="t-body" style={{ fontSize: 14, color: on ? 'var(--ink-2)' : 'rgba(255,255,255,0.6)' }}>{d.sub}</div>
                    </button>
                  );
                })}
              </div>
              <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a note for the recruiter (optional)…"
                style={{ width: '100%', minHeight: 76, padding: '14px 16px', borderRadius: 'var(--r-4)', border: '1px solid rgba(255,255,255,0.18)', background: 'rgba(255,255,255,0.06)', color: '#fff', fontFamily: 'var(--font)', fontSize: 16, resize: 'vertical', marginBottom: 20, boxSizing: 'border-box' }} />
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button kind="primary" icon={<Arrow />} onClick={submit} disabled={!decision || saving} style={{ background: '#fff', color: 'var(--navy)', borderColor: '#fff' }}>{saving ? 'Sending…' : 'Send to Spyglass'}</Button>
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '8px 0' }}>
              <div style={{ display: 'inline-flex', width: 48, height: 48, borderRadius: 99, background: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <CheckIcon c="#fff" />
              </div>
              <h3 style={{ fontFamily: 'var(--font)', fontWeight: 700, fontSize: 24.5, letterSpacing: '-0.03em', margin: '0 0 8px', color: '#fff' }}>
                {decision === 'advance' ? `The recruiter knows — ${first} is moving forward.` : decision === 'hold' ? `Noted. We'll keep ${first} warm.` : `Understood. We'll keep looking.`}
              </h3>
              <p className="t-body" style={{ color: 'rgba(255,255,255,0.7)', margin: '0 auto 24px', maxWidth: '46ch' }}>
                {note ? `"${note}"` : 'Your decision is now on the recruiter’s desk.'}
              </p>
              <Button kind="ghost" onClick={() => setSubmitted(false)} style={{ color: '#fff' }}>Change response</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
