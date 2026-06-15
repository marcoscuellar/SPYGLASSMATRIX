'use client';
/* ============================================================
   Spyglass Matrix — Stage 04: the client side
   Portal (editorial shortlist) · Expanded dossier + feedback ·
   Placement. The only surface the client ever sees.
   ============================================================ */
import React from 'react';
import { Avatar, Button, Eyebrow, FitChip, Mark, Tag } from './ui';
import { Arrow, CheckIcon } from './icons';
import { DossierBody, DossierMeta } from './Dossier';
import { useFlow } from './FlowContext';
import { CANDS } from '@/lib/data';
import type { Candidate, Decision, Feedback } from '@/lib/types';

export function ClientApp() {
  const { clientView, placed } = useFlow();
  if (placed && clientView.name === 'placement') return <Placement />;
  if (clientView.name === 'dossier' && clientView.candId) return <ExpandedDossier candId={clientView.candId} />;
  return <ClientPortal />;
}

function ClientPortal() {
  const { approvals, feedback, setClientView } = useFlow();
  const shortlist = CANDS
    .filter((c) => c.dossier && approvals[c.id] === 'approved')
    .sort((a, b) => (b.fit ?? 0) - (a.fit ?? 0));

  return (
    <div style={{ maxWidth: 1060, margin: '0 auto', padding: '0 40px 110px' }}>
      <header style={{ padding: '64px 0 40px', borderBottom: '1px solid var(--line)', marginBottom: 48 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 30, flexWrap: 'wrap' }}>
          <Mark variant="navy" size={26} />
          <span className="t-mono-tag" style={{ color: 'var(--navy)' }}>PREPARED BY SPYGLASS</span>
          <span style={{ width: 18, height: 1, background: 'var(--line)' }} />
          <span className="t-mono-tag" style={{ color: 'var(--ink-3)' }}>FOR MERIDIAN WEALTH ADVISORS · CONFIDENTIAL</span>
        </div>
        <h1 style={{ fontFamily: "'Geist', sans-serif", fontWeight: 800, fontSize: 'clamp(38px, 5.4vw, 64px)', letterSpacing: '-0.04em', lineHeight: 1.0, margin: '0 0 22px', maxWidth: '15ch' }}>
          Your shortlist for<br /><span className="t-light">Senior Tax Manager.</span>
        </h1>
        <p className="t-body" style={{ color: 'var(--ink-2)', fontSize: 19.5, maxWidth: '60ch', margin: 0 }}>
          {shortlist.length} candidates, hand-screened against the brief you gave us — not just the job description. Each dossier reflects who they are across the table, how they map to what you actually need, and where the risk sits. Open any one to review and tell us where to take it.
        </p>

        <div style={{ display: 'flex', gap: 40, flexWrap: 'wrap', marginTop: 36 }}>
          {[
            { n: 'Jun 6', l: 'Search opened' },
            { n: '47', l: 'Profiles sourced' },
            { n: '9', l: 'Screened in depth' },
            { n: String(shortlist.length), l: 'Presented to you' },
          ].map((s, i) => (
            <div key={i}>
              <div style={{ fontFamily: "'Geist', sans-serif", fontWeight: 800, fontSize: 32.5, letterSpacing: '-0.03em', lineHeight: 1 }}>{s.n}</div>
              <div className="t-mono-xs" style={{ color: 'var(--ink-3)', marginTop: 7 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 22 }}>
        {shortlist.map((c, i) => (
          <PortalCard key={c.id} c={c} rank={i + 1} feedback={feedback[c.id]} onOpen={() => { setClientView({ name: 'dossier', candId: c.id }); window.scrollTo(0, 0); }} />
        ))}
      </div>

      <p className="t-body" style={{ color: 'var(--ink-3)', fontSize: 15, textAlign: 'center', marginTop: 44 }}>
        Held in confidence between Meridian Wealth Advisors and Spyglass. Internal screening notes are not included in this view.
      </p>
    </div>
  );
}

function PortalCard({ c, rank, feedback, onOpen }: { c: Candidate; rank: number; feedback?: Feedback; onOpen: () => void }) {
  const [hover, setHover] = React.useState(false);
  const fbMeta = feedback ? ({
    advance: { t: 'You advanced', tone: 'live' as const },
    hold: { t: 'On hold', tone: 'amber' as const },
    pass: { t: 'Passed', tone: 'pipeline' as const },
  }[feedback.decision]) : null;
  return (
    <div onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} onClick={onOpen}
      style={{ background: 'var(--bg-card)', border: '1px solid var(--line)', borderRadius: 'var(--r-6)', padding: 30, cursor: 'pointer',
        boxShadow: hover ? 'var(--sh-hover)' : 'var(--sh-card)', transform: hover ? 'translateY(-3px)' : 'none', transition: 'all .25s var(--ease)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Avatar initials={c.initials} size={50} accent="var(--navy)" />
          <div>
            <div style={{ fontFamily: "'Geist', sans-serif", fontWeight: 800, fontSize: 22.5, letterSpacing: '-0.03em', lineHeight: 1.1 }}>{c.name}</div>
            <div className="t-body" style={{ color: 'var(--ink-3)', fontSize: 14.5 }}>{c.role} · {c.years} yrs</div>
          </div>
        </div>
        <span className="t-mono-xs" style={{ color: 'var(--ink-4)' }}>0{rank}</span>
      </div>

      <p className="t-body" style={{ color: 'var(--ink)', fontSize: 17.5, fontWeight: 500, margin: '0 0 16px', letterSpacing: '-0.01em', minHeight: 48 }}>{c.dossier!.headline}</p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 22 }}>
        {c.tags.map((t, i) => <Tag key={i} tone="navy">{t}</Tag>)}
      </div>

      <div style={{ marginTop: 'auto', paddingTop: 18, borderTop: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {fbMeta ? <Tag tone={fbMeta.tone}>{fbMeta.t}</Tag> : <FitChip fit={c.fit} size="lg" />}
        <span className="t-mono-xs" style={{ color: hover ? 'var(--navy)' : 'var(--ink-3)', display: 'inline-flex', alignItems: 'center', gap: 6, transition: 'color .2s' }}>
          OPEN DOSSIER <Arrow s={12} />
        </span>
      </div>
    </div>
  );
}

function ExpandedDossier({ candId }: { candId: string }) {
  const { feedback, giveFeedback, setClientView, place } = useFlow();
  const c = CANDS.find((x) => x.id === candId);
  const existing = feedback[candId];
  const [decision, setDecision] = React.useState<Decision | null>(existing ? existing.decision : null);
  const [note, setNote] = React.useState(existing ? existing.note : '');
  const [submitted, setSubmitted] = React.useState(!!existing);

  if (!c) return null;
  const back = () => { setClientView({ name: 'portal', candId: null }); window.scrollTo(0, 0); };
  const submit = () => {
    if (!decision) return;
    giveFeedback(candId, decision, note);
    setSubmitted(true);
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  };
  const goPlace = () => { place(candId); setClientView({ name: 'placement', candId }); window.scrollTo(0, 0); };

  const decisions: { k: Decision; label: string; sub: string }[] = [
    { k: 'advance', label: 'Advance to interview', sub: 'Bring them in to meet the team' },
    { k: 'hold', label: 'Hold for now', sub: 'Interested, but not yet' },
    { k: 'pass', label: 'Pass', sub: 'Not the right fit' },
  ];

  return (
    <div style={{ maxWidth: 880, margin: '0 auto', padding: '36px 40px 110px' }}>
      <button onClick={back} className="t-mono-xs" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3)', display: 'inline-flex', alignItems: 'center', gap: 7, marginBottom: 28, padding: 0 }}>
        <span style={{ transform: 'rotate(180deg)', display: 'inline-flex' }}><Arrow s={12} /></span> BACK TO SHORTLIST
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 30, paddingBottom: 28, borderBottom: '1px solid var(--line)' }}>
        <Avatar initials={c.initials} size={62} accent="var(--navy)" />
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <h1 style={{ fontFamily: "'Geist', sans-serif", fontWeight: 800, fontSize: 36.5, letterSpacing: '-0.035em', margin: 0 }}>{c.name}</h1>
            <FitChip fit={c.fit} size="lg" />
          </div>
          <div className="t-body" style={{ color: 'var(--ink-2)', fontSize: 16.5, marginTop: 4 }}>{c.role} · {c.company}</div>
        </div>
      </div>

      <div style={{ marginBottom: 34 }}><DossierMeta c={c} client /></div>

      <DossierBody c={c} mode="client" />

      <div id="decision-panel" style={{ marginTop: 48, padding: 32, borderRadius: 'var(--r-7)', background: 'var(--navy)', color: '#fff' }}>
        {!submitted ? (
          <>
            <Eyebrow style={{ color: 'var(--navy-fade)', marginBottom: 14 }}>YOUR CALL</Eyebrow>
            <h3 style={{ fontFamily: "'Geist', sans-serif", fontWeight: 700, fontSize: 25.5, letterSpacing: '-0.03em', margin: '0 0 6px', color: '#fff' }}>Where should we take {c.name.split(' ')[0]}?</h3>
            <p className="t-body" style={{ color: 'rgba(255,255,255,0.7)', margin: '0 0 24px' }}>Your decision routes straight back to Priya. No email thread, no lag.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
              {decisions.map((d) => {
                const on = decision === d.k;
                return (
                  <button key={d.k} onClick={() => setDecision(d.k)}
                    style={{ textAlign: 'left', padding: '16px 18px', borderRadius: 'var(--r-4)', cursor: 'pointer',
                      backgroundColor: on ? '#fff' : 'rgba(255,255,255,0.06)', border: `1px solid ${on ? '#fff' : 'rgba(255,255,255,0.18)'}`, transition: 'color .2s var(--ease)' }}>
                    <div style={{ fontFamily: "'Geist', sans-serif", fontWeight: 700, fontSize: 16.5, color: on ? 'var(--navy)' : '#fff', marginBottom: 4 }}>{d.label}</div>
                    <div className="t-body" style={{ fontSize: 14, color: on ? 'var(--ink-2)' : 'rgba(255,255,255,0.6)' }}>{d.sub}</div>
                  </button>
                );
              })}
            </div>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a note for the recruiter (optional)…"
              style={{ width: '100%', minHeight: 76, padding: '14px 16px', borderRadius: 'var(--r-4)', border: '1px solid rgba(255,255,255,0.18)', background: 'rgba(255,255,255,0.06)', color: '#fff', fontFamily: "'Geist', sans-serif", fontSize: 16, resize: 'vertical', marginBottom: 20, boxSizing: 'border-box' }} />
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button kind="primary" icon={<Arrow />} onClick={submit} disabled={!decision} style={{ background: '#fff', color: 'var(--navy)', borderColor: '#fff' }}>Send to Spyglass</Button>
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '8px 0' }}>
            <div style={{ display: 'inline-flex', width: 48, height: 48, borderRadius: 99, background: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <CheckIcon c="#fff" />
            </div>
            <h3 style={{ fontFamily: "'Geist', sans-serif", fontWeight: 700, fontSize: 24.5, letterSpacing: '-0.03em', margin: '0 0 8px', color: '#fff' }}>
              {decision === 'advance' ? `Priya knows — ${c.name.split(' ')[0]} is moving forward.` : decision === 'hold' ? `Noted. We'll keep ${c.name.split(' ')[0]} warm.` : `Understood. We'll keep looking.`}
            </h3>
            <p className="t-body" style={{ color: 'rgba(255,255,255,0.7)', margin: '0 auto 24px', maxWidth: '46ch' }}>
              {note ? `"${note}"` : 'Your decision is now on the recruiter’s pipeline in real time.'}
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button kind="ghost" onClick={() => setSubmitted(false)} style={{ color: '#fff' }}>Change response</Button>
              {decision === 'advance' && <Button onClick={goPlace} icon={<Arrow />} style={{ background: 'var(--amber)', color: '#1a1206', borderColor: 'var(--amber)' }}>Extend an offer</Button>}
              {decision !== 'advance' && <Button onClick={back} style={{ background: '#fff', color: 'var(--navy)', borderColor: '#fff' }}>Back to shortlist</Button>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Placement() {
  const { placed, setClientView } = useFlow();
  const c = CANDS.find((x) => x.id === placed);
  if (!c) return null;
  const journey = ['Intake', 'The Matrix', 'Sourcing', 'Screening', 'Internal Review', 'Client Ready', 'Placed'];

  return (
    <div style={{ maxWidth: 880, margin: '0 auto', padding: '20px 40px 110px' }}>
      <div style={{ borderRadius: 'var(--r-8)', overflow: 'hidden', background: 'var(--navy)', color: 'var(--cream)', marginBottom: 28 }}>
        <div style={{ padding: '64px 56px 56px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 36 }}>
            <Mark variant="forest" size={28} />
            <span className="t-mono-tag" style={{ color: 'var(--amber)' }}>SEARCH CLOSED · MERIDIAN WEALTH ADVISORS</span>
          </div>
          <h1 style={{ fontFamily: "'Geist', sans-serif", fontWeight: 800, fontSize: 'clamp(40px, 6vw, 68px)', letterSpacing: '-0.04em', lineHeight: 1.0, margin: '0 0 22px' }}>
            {c.name} is your<br /><span style={{ color: 'var(--amber)', fontWeight: 400 }}>Senior Tax Manager.</span>
          </h1>
          <p className="t-body" style={{ color: 'rgba(245,239,224,0.82)', fontSize: 19.5, maxWidth: '54ch', margin: 0 }}>
            From a first client meeting on Jun 6 to a signed offer — one connected thread, every internal note sealed, nothing leaked. This is what the Matrix is for.
          </p>

          <div style={{ display: 'flex', gap: 40, flexWrap: 'wrap', marginTop: 44 }}>
            {[{ n: '7 days', l: 'Intake to offer' }, { n: String(c.fit), l: 'Matrix fit score' }, { n: c.compExp.split('–')[0], l: 'Offer anchored' }].map((s, i) => (
              <div key={i}>
                <div style={{ fontFamily: "'Geist', sans-serif", fontWeight: 800, fontSize: 36.5, letterSpacing: '-0.03em', lineHeight: 1, color: 'var(--cream)' }}>{s.n}</div>
                <div className="t-mono-xs" style={{ color: 'var(--navy-fade)', marginTop: 8 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ padding: '26px 30px', border: '1px solid var(--line)', borderRadius: 'var(--r-6)', background: 'var(--bg-card)' }}>
        <div className="t-mono-xs" style={{ color: 'var(--ink-3)', marginBottom: 18 }}>THE FULL THREAD</div>
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
          {journey.map((j, i) => (
            <React.Fragment key={j}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 13px', borderRadius: 99, background: i === journey.length - 1 ? 'var(--navy)' : 'var(--paper)', border: `1px solid ${i === journey.length - 1 ? 'var(--navy)' : 'var(--line)'}` }}>
                <span style={{ width: 6, height: 6, borderRadius: 99, background: i === journey.length - 1 ? 'var(--amber)' : 'var(--ink-4)' }} />
                <span style={{ fontFamily: "'Geist', sans-serif", fontWeight: 600, fontSize: 14.5, color: i === journey.length - 1 ? 'var(--cream)' : 'var(--ink-2)' }}>{j}</span>
              </span>
              {i < journey.length - 1 && <span style={{ color: 'var(--ink-4)', padding: '0 2px' }}>·</span>}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 30 }}>
        <Button kind="secondary" onClick={() => { setClientView({ name: 'portal', candId: null }); window.scrollTo(0, 0); }}>Back to the shortlist</Button>
      </div>
    </div>
  );
}
