'use client';
/* ============================================================
   Spyglass Matrix — candidate dossier body
   Renders two ways: recruiter (full — scorecard, internal notes,
   watch-outs, timeline) and client (sanitized packet — AI brief,
   positioning, fit map). The client portal uses the client mode.
   ============================================================ */
import React from 'react';
import { Button, Eyebrow, Tag } from './ui';
import { Arrow, CheckIcon, LockIcon, SparkIcon } from './icons';
import { Mark } from './ui';
import { SCORE_META } from '@/lib/data';
import type { Candidate, Signal } from '@/lib/types';

type Mode = 'recruiter' | 'client';

export function SignalScore({ s, mode }: { s: Signal; mode: Mode }) {
  const m = SCORE_META[s.score];
  return (
    <div style={{ padding: '15px 0', borderBottom: '1px solid var(--line)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, marginBottom: mode === 'client' ? 0 : 7 }}>
        <span style={{ fontFamily: "'Geist', sans-serif", fontWeight: 600, fontSize: 17, letterSpacing: '-0.01em' }}>{s.signal}</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <span style={{ display: 'inline-flex', gap: 3 }}>
            {[0, 1, 2].map((i) => (
              <span key={i} style={{ width: 7, height: 7, borderRadius: 99, background: i < m.dots ? m.color : 'var(--ink-4)' }} />
            ))}
          </span>
          <span className="t-mono-xs" style={{ color: m.color, minWidth: 44, textAlign: 'right' }}>{m.label}</span>
        </span>
      </div>
      {mode !== 'client' && (
        <div className="t-body" style={{ color: 'var(--ink-2)', fontSize: 15, paddingRight: 100 }}>{s.evidence}</div>
      )}
    </div>
  );
}

export function ClientBrief({ c }: { c: Candidate }) {
  const d = c.dossier!;
  const w = d.writeup;
  const [drafting, setDrafting] = React.useState(false);
  if (!w) return null;
  const first = c.name.split(' ')[0];
  const redraft = () => { setDrafting(true); setTimeout(() => setDrafting(false), 1500); };
  const toDecision = () => {
    const el = document.getElementById('decision-panel');
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 24, behavior: 'smooth' });
  };
  return (
    <div style={{ border: '1px solid var(--line)', borderRadius: 'var(--r-7)', overflow: 'hidden', background: 'var(--bg-card)', boxShadow: 'var(--sh-card)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, padding: '15px 22px', borderBottom: '1px solid var(--line)', background: 'var(--paper)', flexWrap: 'wrap' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 9 }}>
          <SparkIcon c="var(--navy)" />
          <span className="t-mono-tag" style={{ color: 'var(--navy)' }}>SPYGLASS AI · CANDIDATE BRIEF</span>
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 12 }}>
          <span className="t-mono-xs" style={{ color: 'var(--ink-3)' }}>DRAFTED FROM THE BRIEF</span>
          <button onClick={redraft} className="t-mono-xs" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 11px', borderRadius: 'var(--r-2)', border: '1px solid var(--line)', background: 'var(--bg)', color: 'var(--ink-2)', cursor: 'pointer' }}>↻ Re-draft</button>
        </span>
      </div>
      <div style={{ padding: '26px 30px 30px', position: 'relative' }}>
        {drafting && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 5, display: 'grid', placeItems: 'center', background: 'rgba(255,255,255,0.62)', backdropFilter: 'blur(3px)' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 11, fontFamily: "'Geist Mono', monospace", fontSize: 13.5, color: 'var(--ink-2)' }}>
              <span style={{ display: 'inline-flex', width: 24, height: 24, animation: 'spgSpin 1.1s linear infinite' }}><Mark variant="navy" size={24} /></span>
              Drafting against the {c.role} brief…
            </div>
          </div>
        )}
        <div style={{ opacity: drafting ? 0.2 : 1, transition: 'opacity .25s' }}>
          <div className="t-mono-xs" style={{ color: 'var(--ink-4)', marginBottom: 16, lineHeight: 1.5 }}>Auto-drafted by Spyglass AI from the role brief when the recruiter is short on time — reviewed before release.</div>
          <h3 style={{ fontFamily: "'Geist', sans-serif", fontWeight: 800, fontSize: 27, letterSpacing: '-0.03em', lineHeight: 1.16, margin: '0 0 14px' }}>{d.headline}</h3>
          <p className="t-body" style={{ color: 'var(--ink-2)', fontSize: 18.5, margin: '0 0 28px', maxWidth: '62ch' }}>{w.intro}</p>

          <div className="t-mono-xs t-section-label" style={{ marginBottom: 16 }}>WHY {first.toUpperCase()} FITS THE BRIEF</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 13, marginBottom: 30 }}>
            {w.fit.map((f, i) => (
              <div key={i} style={{ display: 'flex', gap: 13, alignItems: 'flex-start' }}>
                <span style={{ width: 25, height: 25, borderRadius: 99, background: 'var(--navy)', display: 'grid', placeItems: 'center', flexShrink: 0, marginTop: 1 }}><CheckIcon c="#fff" /></span>
                <span className="t-body" style={{ fontSize: 17, color: 'var(--ink)', lineHeight: 1.5 }}>{f}</span>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap', padding: '22px 26px', borderRadius: 'var(--r-5)', background: 'var(--navy)' }}>
            <p style={{ margin: 0, fontFamily: "'Geist', sans-serif", fontWeight: 600, fontSize: 18, lineHeight: 1.45, letterSpacing: '-0.01em', color: '#fff', maxWidth: '46ch' }}>{w.cta}</p>
            <Button onClick={toDecision} icon={<Arrow />} style={{ background: 'var(--amber)', color: '#2a2008', borderColor: 'var(--amber)', flexShrink: 0 }}>Make your decision</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function DossierBody({ c, mode }: { c: Candidate; mode: Mode }) {
  const d = c.dossier!;
  const client = mode === 'client';
  const visibleSignals = client ? d.signals.filter((s) => s.score !== 'gap') : d.signals;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: client ? 34 : 30 }}>
      {client && <ClientBrief c={c} />}

      {!client && (
        <>
          <div>
            <Eyebrow style={{ marginBottom: 12, color: 'var(--amber-dd)' }}>AI DOSSIER · GENERATED FROM THE SCREEN</Eyebrow>
            <h3 style={{ fontFamily: "'Geist', sans-serif", fontWeight: 800, fontSize: 23.5, letterSpacing: '-0.03em', margin: '0 0 12px', lineHeight: 1.15 }}>{d.headline}</h3>
            <p className="t-body" style={{ color: 'var(--ink-2)', fontSize: 17, margin: 0, maxWidth: '60ch' }}>{d.summary}</p>
          </div>

          <div>
            <div className="t-mono-xs" style={{ color: 'var(--ink-3)', marginBottom: 14 }}>HIGHLIGHTS</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10 }}>
              {d.highlights.map((h, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <span style={{ color: 'var(--ink-4)', paddingTop: 2, flexShrink: 0 }}>—</span>
                  <span className="t-body" style={{ color: 'var(--ink-2)', fontSize: 16.5, lineHeight: 1.5 }}>{h}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Mapped to the Matrix */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <span className="t-mono-xs" style={{ color: 'var(--ink-3)' }}>{client ? 'HOW THEY MAP TO YOUR BRIEF' : 'MAPPED TO THE MATRIX'}</span>
          {!client && <Tag tone="amber">Internal scoring</Tag>}
        </div>
        <div>
          {visibleSignals.map((s, i) => <SignalScore key={i} s={s} mode={mode} />)}
        </div>
      </div>

      {/* Recruiter-only: internal notes + watch-outs + timeline */}
      {!client && (
        <>
          {d.internalNotes && d.internalNotes.length > 0 && (
            <div style={{ padding: '20px 22px', background: 'var(--navy)', borderRadius: 'var(--r-5)' }}>
              <div className="t-mono-xs" style={{ color: 'var(--amber)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                <LockIcon c="var(--amber)" /> RECRUITER NOTES · NEVER LEAVES SPYGLASS
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {d.internalNotes.map((n, i) => (
                  <div key={i} style={{ display: 'flex', gap: 14, padding: '13px 0', borderTop: i > 0 ? '1px solid rgba(255,255,255,0.1)' : 'none' }}>
                    <span className="t-mono-xs" style={{ color: 'var(--amber)', flexShrink: 0, paddingTop: 2, minWidth: 64 }}>{n.tag}</span>
                    <span style={{ fontFamily: "'Geist', sans-serif", fontSize: 15, lineHeight: 1.55, color: 'rgba(255,255,255,0.82)' }}>{n.note}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {d.watchOuts && d.watchOuts.length > 0 && (
            <div>
              <div className="t-mono-xs" style={{ color: 'var(--ink-3)', marginBottom: 12 }}>WATCH-OUTS</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {d.watchOuts.map((w, i) => (
                  <div key={i} className="t-body" style={{ display: 'flex', gap: 10, color: 'var(--ink-2)', fontSize: 15 }}>
                    <span style={{ color: 'var(--amber-dd)' }}>⚠</span>{w}
                  </div>
                ))}
              </div>
            </div>
          )}
          {d.timeline && (
            <div>
              <div className="t-mono-xs" style={{ color: 'var(--ink-3)', marginBottom: 14 }}>SCREEN TIMELINE</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {d.timeline.map((t, i) => (
                  <div key={i} style={{ display: 'flex', gap: 16, paddingBottom: i < d.timeline!.length - 1 ? 14 : 0 }}>
                    <span className="t-mono-xs" style={{ color: 'var(--ink-3)', minWidth: 48, paddingTop: 1 }}>{t.d}</span>
                    <span style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <span style={{ width: 8, height: 8, borderRadius: 99, background: i === d.timeline!.length - 1 ? 'var(--green)' : 'var(--ink-4)', marginTop: 4 }} />
                      {i < d.timeline!.length - 1 && <span style={{ width: 1, flex: 1, background: 'var(--line)' }} />}
                    </span>
                    <span className="t-body" style={{ color: 'var(--ink-2)', fontSize: 15, paddingBottom: 4 }}>{t.e}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export function DossierMeta({ c, client }: { c: Candidate; client?: boolean }) {
  const items = [
    { l: 'Current', v: `${c.role}, ${c.company}` },
    { l: 'Experience', v: `${c.years} years` },
    { l: 'Location', v: c.location },
    { l: client ? 'Comp expectation' : 'Comp ask', v: c.compExp },
    { l: 'Availability', v: c.avail },
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 1, background: 'var(--line)', border: '1px solid var(--line)', borderRadius: 'var(--r-4)', overflow: 'hidden' }}>
      {items.map((it, i) => (
        <div key={i} style={{ background: 'var(--bg-card)', padding: '14px 16px' }}>
          <div className="t-mono-xs" style={{ color: 'var(--ink-3)', marginBottom: 6 }}>{it.l}</div>
          <div style={{ fontFamily: "'Geist', sans-serif", fontSize: 15, fontWeight: 500, color: 'var(--ink)' }}>{it.v}</div>
        </div>
      ))}
    </div>
  );
}
