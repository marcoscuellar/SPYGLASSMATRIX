'use client';
/* ============================================================
   Spyglass Matrix — Stage 02: the generated, forked document
   Recruiter view (full strategy) ⇄ Candidate view (sanitized).
   Internal sections are removed from the DOM in candidate view.
   ============================================================ */
import React from 'react';
import { Card, Mark, Tag, MonoButton } from './ui';
import { Arrow, LockIcon, CheckIcon, PrinterIcon, EyeIcon, FlagIcon } from './icons';
import { JdDocument } from './JdDocument';
import type { Matrix, Question } from '@/lib/types';

type Mode = 'recruiter' | 'candidate';

export function MatrixView({ matrix }: { matrix: Matrix }) {
  const [generating, setGenerating] = React.useState(false);
  const [mode, setMode] = React.useState<Mode>('recruiter');
  const regen = () => { setGenerating(true); setTimeout(() => setGenerating(false), 1900); };

  return (
    <div>
      <div className="print-hide" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, marginBottom: 22, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <ModeToggle mode={mode} setMode={setMode} />
          <span className="t-mono-xs" style={{ color: 'var(--ink-3)' }}>
            {mode === 'recruiter' ? 'FULL STRATEGY · INTERNAL' : 'SANITIZED · SAFE TO SHARE'}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <MonoButton onClick={regen}>↻ Re-run</MonoButton>
          <MonoButton onClick={() => window.print()}><PrinterIcon /> {mode === 'candidate' ? 'Print packet' : 'Print'}</MonoButton>
        </div>
      </div>

      <div style={{ position: 'relative' }}>
        {generating && <GenerationOverlay />}
        <MatrixDoc mode={mode} M={matrix} />
      </div>
    </div>
  );
}

function ModeToggle({ mode, setMode }: { mode: Mode; setMode: (m: Mode) => void }) {
  const opts: { key: Mode; label: string; ic: React.ReactNode }[] = [
    { key: 'recruiter', label: 'Recruiter view', ic: <EyeIcon /> },
    { key: 'candidate', label: 'Candidate view', ic: <LockIcon c="currentColor" /> },
  ];
  return (
    <div style={{ display: 'inline-flex', background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 'var(--r-3)', padding: 3, gap: 3 }}>
      {opts.map((o) => {
        const on = mode === o.key;
        const accent = o.key === 'recruiter' ? 'var(--ink)' : 'var(--navy)';
        return (
          <button key={o.key} onClick={() => setMode(o.key)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 9, cursor: 'pointer', border: 'none',
              backgroundColor: on ? accent : 'transparent', color: on ? '#fff' : 'var(--ink-2)',
              fontFamily: "'Geist', sans-serif", fontWeight: 600, fontSize: 15, transition: 'color .2s var(--ease)' }}>
            {o.ic} {o.label}
          </button>
        );
      })}
    </div>
  );
}

function MatrixDoc({ mode, M }: { mode: Mode; M: Matrix }) {
  const candidate = mode === 'candidate';
  const railColor = candidate ? 'var(--navy)' : 'var(--amber)';
  const meta = [
    { l: 'Engagement', v: M.empType },
    { l: 'Location', v: M.location },
    !candidate ? { l: 'Compensation', v: M.salary } : null,
    { l: 'Opened', v: M.date },
  ].filter((x): x is { l: string; v: string } => !!(x && x.v));

  return (
    <Card style={{ padding: 0, overflow: 'hidden', borderColor: candidate ? 'rgba(10,31,61,0.25)' : 'var(--line)', transition: 'border-color .3s' }}>
      {/* Header band */}
      <div style={{ padding: '26px 40px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: candidate ? 'rgba(10,31,61,0.03)' : 'var(--amber-bg)', transition: 'background .3s' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Mark variant={candidate ? 'navy' : 'amber'} size={34} />
          <div>
            <div className="t-mono-xs" style={{ color: 'var(--navy)', marginBottom: 4 }}>{candidate ? 'CANDIDATE PACKET' : 'RECRUITER STRATEGY · THE MATRIX'}</div>
            <div style={{ fontFamily: "'Geist', sans-serif", fontWeight: 700, fontSize: 19.5, letterSpacing: '-0.02em' }}>
              {M.jd.title} · {M.client || 'Meridian Wealth Advisors'}{M.empType ? ' · ' + M.empType : ''}
            </div>
          </div>
        </div>
        <Tag tone={candidate ? 'navy' : 'amber'}>{candidate ? 'Internal notes stripped' : 'Generated ' + (M.date || 'Jun 6')}</Tag>
      </div>

      {meta.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', borderBottom: '1px solid var(--line)', background: candidate ? 'rgba(10,31,61,0.02)' : 'var(--amber-bg)' }}>
          {meta.map((x, i) => (
            <div key={i} style={{ padding: '15px 26px', borderRight: '1px solid var(--line)' }}>
              <div className="t-mono-xs" style={{ color: 'var(--ink-3)', marginBottom: 5 }}>{x.l}</div>
              <div style={{ fontFamily: "'Geist', sans-serif", fontWeight: 600, fontSize: 15.5, color: 'var(--ink)' }}>{x.v}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ padding: '38px 40px', display: 'grid', gridTemplateColumns: '170px 1fr', gap: 36, alignItems: 'start' }}>
        <div className="print-hide" style={{ position: 'sticky', top: 24, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <DocNav label="Job description" active railColor={railColor} />
          <DocNav label="What to look for" muted={candidate} railColor={railColor} />
          <DocNav label="Qualifying questions" railColor={railColor} />
          <DocNav label="Search & watch-outs" muted={candidate} railColor={railColor} />
        </div>

        <div style={{ maxWidth: 680 }}>
          {/* 01 — JD : identical in both views */}
          <section style={{ marginBottom: 40 }}>
            <SectionHead n="01" title="Job description" sub="Kept intact — the role exactly as it was submitted." />
            {M.jd.fullText ? (
              <JdDocument text={M.jd.fullText} />
            ) : (
              <>
                <p className="t-body" style={{ fontSize: 17.5, color: 'var(--ink-2)', marginTop: 0, marginBottom: 14 }}>{M.jd.summary}</p>
                <p className="t-body" style={{ fontSize: 17.5, color: 'var(--ink-2)', marginTop: 0, marginBottom: 0 }}>{M.jd.summary2}</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 30, marginTop: 26 }}>
                  <DocList title="Must have" items={M.jd.mustHave} />
                  <DocList title="Nice to have" items={M.jd.niceToHave} />
                </div>
              </>
            )}
          </section>

          {/* 02 — What to look for : INTERNAL */}
          <section style={{ marginBottom: 40 }}>
            <SectionHead n="02" title="What to look for" sub="The strategy layer — the soft skills, turned into signals." internal />
            {candidate ? (
              <Redacted label="Internal strategy — hidden from the candidate packet" />
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 14 }}>
                {M.lookFor.map((l, i) => (
                  <div key={i} style={{ padding: '18px 20px', background: 'var(--navy)', borderRadius: 'var(--r-4)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
                      <span style={{ width: 6, height: 6, borderRadius: 99, background: 'var(--amber)', flexShrink: 0 }} />
                      <div style={{ fontFamily: "'Geist', sans-serif", fontWeight: 700, fontSize: 16.5, color: '#fff' }}>{l.signal}</div>
                    </div>
                    <div style={{ fontFamily: "'Geist', sans-serif", fontSize: 15, lineHeight: 1.5, color: 'rgba(255,255,255,0.78)' }}>{l.detail}</div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* 03 — Qualifying questions */}
          <section>
            <SectionHead n="03" title="Qualifying questions"
              sub={candidate ? 'Use these in the interview.' : 'Each maps to a signal — with internal guidance for the screen.'} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
              {M.questions.map((q, i) => <QuestionRow key={i} i={i} q={q} candidate={candidate} />)}
            </div>
          </section>

          {/* 04 — Search & watch-outs : INTERNAL */}
          <section style={{ marginTop: 40 }}>
            <SectionHead n="04" title="Search & watch-outs" sub="How we hunt the role — and the traps the client cannot afford to fall into again." internal />
            {candidate ? (
              <Redacted label="Sourcing strategy & watch-outs — internal to Spyglass" />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18, marginTop: 16 }}>
                <div>
                  <div className="t-mono-xs t-section-label" style={{ marginBottom: 10 }}>TARGET TITLES</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {M.targetTitles.map((t, i) => <Tag key={i} tone={i === 0 ? 'ink' : 'pipeline'}>{t}</Tag>)}
                  </div>
                </div>
                <div>
                  <div className="t-mono-xs t-section-label" style={{ marginBottom: 10 }}>BOOLEAN SEARCH ASSET</div>
                  <div style={{ position: 'relative', padding: '16px 18px', background: 'var(--ink)', borderRadius: 'var(--r-4)' }}>
                    <code style={{ fontFamily: "'Geist Mono', monospace", fontSize: 14, lineHeight: 1.7, color: '#e5e5e5', wordBreak: 'break-word' }}>{M.boolean}</code>
                    <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
                      <span className="t-mono-xs" style={{ color: 'var(--ink-4)', display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                        <span style={{ width: 5, height: 5, borderRadius: 99, background: 'var(--amber)' }} /> READY TO PASTE INTO LINKEDIN RECRUITER
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="t-mono-xs t-section-label" style={{ marginBottom: 10 }}>WATCH-OUTS</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {M.watchOuts.map((w, i) => (
                      <div key={i} style={{ display: 'flex', gap: 13, padding: '15px 17px', background: 'var(--navy)', borderRadius: 'var(--r-4)' }}>
                        <span style={{ paddingTop: 1, flexShrink: 0 }}><FlagIcon c="var(--amber)" /></span>
                        <div>
                          <div style={{ fontFamily: "'Geist', sans-serif", fontWeight: 700, fontSize: 16, marginBottom: 3, color: '#fff' }}>{w.flag}</div>
                          <div style={{ fontFamily: "'Geist', sans-serif", fontSize: 15, lineHeight: 1.5, color: 'rgba(255,255,255,0.78)' }}>{w.note}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </Card>
  );
}

function DocNav({ label, active, muted, railColor }: { label: string; active?: boolean; muted?: boolean; railColor: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', opacity: muted ? 0.4 : 1, transition: 'opacity .3s' }}>
      <span style={{ width: 6, height: 6, borderRadius: 99, background: active ? railColor : 'var(--ink-4)', transition: 'background .3s' }} />
      <span style={{ fontFamily: "'Geist', sans-serif", fontSize: 15, fontWeight: active ? 600 : 500, color: active ? 'var(--ink)' : 'var(--ink-3)' }}>{label}</span>
    </div>
  );
}

function SectionHead({ n, title, sub, internal }: { n: string; title: string; sub: string; internal?: boolean }) {
  return (
    <div style={{ marginBottom: 6 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
        <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: 13.5, color: 'var(--ink-3)' }}>{n}</span>
        <h3 style={{ fontFamily: "'Geist', sans-serif", fontWeight: 700, fontSize: 25.5, letterSpacing: '-0.03em', margin: 0 }}>{title}</h3>
        {internal && <Tag tone="amber">Internal</Tag>}
      </div>
      <p className="t-body" style={{ color: 'var(--ink-3)', margin: 0, paddingLeft: 24 }}>{sub}</p>
    </div>
  );
}

function DocList({ title, items }: { title: string; items: string[] }) {
  return (
    <div style={{ marginTop: 20 }}>
      <div className="t-mono-xs t-section-label" style={{ marginBottom: 10 }}>{title}</div>
      <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 9 }}>
        {items.map((it, i) => (
          <li key={i} style={{ display: 'flex', gap: 12, fontFamily: "'Geist', sans-serif", fontSize: 16.5, lineHeight: 1.5, color: 'var(--ink-2)' }}>
            <span style={{ color: 'var(--ink-4)', paddingTop: 2 }}>—</span>{it}
          </li>
        ))}
      </ul>
    </div>
  );
}

function QuestionRow({ i, q, candidate }: { i: number; q: Question; candidate: boolean }) {
  return (
    <div style={{ padding: 20, border: '1px solid var(--line)', borderRadius: 'var(--r-4)', background: 'var(--bg-card)', transition: 'all .25s var(--ease)' }}>
      <div style={{ display: 'flex', gap: 14 }}>
        <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: 13.5, color: 'var(--navy)', fontWeight: 600, paddingTop: 2 }}>Q{i + 1}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "'Geist', sans-serif", fontWeight: 600, fontSize: 18, letterSpacing: '-0.01em', lineHeight: 1.4 }}>{q.q}</div>
          <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="t-mono-xs" style={{ color: 'var(--ink-3)' }}>SURFACES</span>
            <span style={{ fontFamily: "'Geist', sans-serif", fontSize: 14.5, color: 'var(--ink-2)' }}>{q.surfaces}</span>
          </div>
          {!candidate && (
            <div style={{ overflow: 'hidden', marginTop: 12, animation: 'spgReveal .35s var(--ease)' }}>
              <div style={{ display: 'flex', gap: 9, padding: '11px 13px', background: 'var(--paper)', borderRadius: 'var(--r-2)', borderLeft: '2px solid var(--navy)' }}>
                <span style={{ paddingTop: 1 }}><LockIcon c="var(--navy)" /></span>
                <div>
                  <span className="t-mono-xs" style={{ color: 'var(--navy)', display: 'block', marginBottom: 3 }}>WHY WE ASK · INTERNAL</span>
                  <span style={{ fontFamily: "'Geist', sans-serif", fontSize: 15, color: 'var(--ink-2)', lineHeight: 1.45 }}>{q.internal}</span>
                </div>
              </div>
            </div>
          )}
          {!candidate && (
            <div style={{ marginTop: 12 }}>
              <span className="t-mono-xs" style={{ color: 'var(--navy)', display: 'block', marginBottom: 6 }}>YOUR NOTES · TYPE WHILE YOU TALK</span>
              <textarea
                placeholder="Great speaking with you… jot the messy notes here while you're on the call."
                style={{ width: '100%', minHeight: 64, resize: 'vertical', padding: '11px 13px', border: '1px solid var(--line)', borderRadius: 'var(--r-2)', fontFamily: "'Geist', sans-serif", fontSize: 15, color: 'var(--ink)', background: 'var(--bg-card)', boxSizing: 'border-box' }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Redacted({ label }: { label: string }) {
  return (
    <div style={{ marginTop: 14, padding: '20px 22px', borderRadius: 'var(--r-4)', border: '1px dashed rgba(10,31,61,0.25)', background: 'rgba(10,31,61,0.03)', display: 'flex', alignItems: 'center', gap: 12 }}>
      <LockIcon c="var(--navy)" />
      <span style={{ fontFamily: "'Geist', sans-serif", fontSize: 15.5, fontWeight: 500, color: 'var(--navy)' }}>{label}</span>
      <div style={{ flex: 1, display: 'flex', gap: 6, marginLeft: 8 }}>
        {[60, 40, 75, 30].map((w, i) => <span key={i} style={{ height: 8, width: w, background: 'rgba(10,31,61,0.12)', borderRadius: 2 }} />)}
      </div>
    </div>
  );
}

function GenerationOverlay() {
  const steps = ['Reading the client meeting…', 'Extracting soft-skill signals…', 'Mapping signals to questions…', 'Sealing internal notes…'];
  const [s, setS] = React.useState(0);
  React.useEffect(() => {
    const t = setInterval(() => setS((v) => Math.min(v + 1, steps.length - 1)), 460);
    return () => clearInterval(t);
  }, [steps.length]);
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 20, background: 'rgba(255,255,255,0.82)', backdropFilter: 'blur(8px)', borderRadius: 'var(--r-6)', display: 'grid', placeItems: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', marginBottom: 20, animation: 'spgSpin 1.1s linear infinite', width: 40, height: 40 }}><Mark variant="amber" size={40} /></div>
        <div style={{ fontFamily: "'Geist Mono', monospace", fontSize: 14.5, color: 'var(--ink-2)', letterSpacing: '0.02em' }}>{steps[s]}</div>
      </div>
    </div>
  );
}
