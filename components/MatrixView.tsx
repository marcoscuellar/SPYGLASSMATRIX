'use client';
/* ============================================================
   Spyglass Matrix — Stage 02: the OHMatrix workstation
   Navy sticky rail · JD hero · Recruiter ⇄ Candidate-safe toggle ·
   live grading + fit score · boolean copy · watch-outs · print/Word.
   Wired to the app's Matrix data; internal sections hide in the
   candidate-safe view (removed from the DOM, not just hidden).
   ============================================================ */
import React from 'react';
import type { Matrix } from '@/lib/types';

type Mode = 'recruiter' | 'candidate';
const GLABEL: Record<number, string> = { 3: 'Strong', 2: 'Solid', 1: 'Partial', 0: 'Gap' };
const NAV: { id: string; label: string; internal: boolean }[] = [
  { id: 'jd', label: 'Job Description', internal: false },
  { id: 'look', label: 'What to Look For', internal: true },
  { id: 'questions', label: 'Screening Questions', internal: false },
  { id: 'titles', label: 'Target Titles', internal: true },
  { id: 'boolean', label: 'Boolean Search', internal: true },
  { id: 'watch', label: 'Watch-Outs', internal: true },
];

export function MatrixView({ matrix: M }: { matrix: Matrix }) {
  const [mode, setMode] = React.useState<Mode>('recruiter');
  const [jdOpen, setJdOpen] = React.useState(false);
  const [grades, setGrades] = React.useState<Record<number, number>>({});
  const [copied, setCopied] = React.useState(false);
  const [active, setActive] = React.useState('jd');
  const contentRef = React.useRef<HTMLDivElement>(null);
  const candidate = mode === 'candidate';

  // Scrollspy: highlight the rail item for the section in view.
  React.useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) setActive(e.target.id); }),
      { rootMargin: '-20% 0px -70% 0px' },
    );
    NAV.forEach(({ id }) => { const el = document.getElementById(id); if (el) obs.observe(el); });
    return () => obs.disconnect();
  }, []);

  const fit = React.useMemo(() => {
    const keys = Object.keys(grades);
    const n = M.questions.length || 1;
    const got = keys.reduce((s, k) => s + grades[Number(k)], 0);
    const pct = Math.round((got / (n * 3)) * 100);
    const word = pct >= 80 ? 'Strong fit' : pct >= 55 ? 'Solid fit' : pct >= 30 ? 'Partial fit' : 'Gap — weak fit';
    return { has: keys.length > 0, pct, word, count: keys.length, n: M.questions.length };
  }, [grades, M.questions.length]);

  const goTo = (id: string) => { document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
  const copyBool = () => {
    try { navigator.clipboard?.writeText(M.boolean); } catch { /* noop */ }
    setCopied(true); setTimeout(() => setCopied(false), 1200);
  };
  const exportDoc = () => {
    const body = contentRef.current?.innerHTML || '';
    const html = '<html xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"></head><body>' + body + '</body></html>';
    const blob = new Blob(['﻿' + html], { type: 'application/msword' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'Spyglass-Matrix-' + (M.jd.title || 'Role').replace(/\s+/g, '-') + '.doc';
    a.click();
  };

  const heroFacts = [
    { k: 'Client', v: M.client },
    { k: 'Location', v: M.location },
    { k: 'Compensation', v: M.salary },
    { k: 'Type', v: M.empType },
  ].filter((f) => !!f.v);
  const metaLine = [M.client, M.empType, M.salary, M.location].filter(Boolean).join(' · ').toUpperCase();

  return (
    <div className={'mtx' + (candidate ? ' candidate' : '')}>
      <div className="layout">
        {/* ===== Sticky rail ===== */}
        <nav className="nav">
          <div className="brand"><span className="mark" /><span className="t">Spyglass <span className="m-caps">Matrix</span></span></div>
          {NAV.map((it) => (
            <a key={it.id} className={(it.internal ? 'int-only ' : '') + (active === it.id ? 'on' : '')}
              role="button" tabIndex={0} onClick={() => goTo(it.id)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') goTo(it.id); }}>
              <span className="dot" /> {it.label}
            </a>
          ))}
          <div className="navnote">The rail stays put as you scroll. Internal sections hide in Candidate view.</div>
        </nav>

        {/* ===== Content ===== */}
        <div className="content" ref={contentRef}>
          <div className="bar">
            <div>
              <div className="role">{M.jd.title} <span className="m-caps">Matrix</span></div>
              {metaLine && <div className="meta">{metaLine}</div>}
            </div>
            <div className="actions">
              <div className="toggle">
                <button className={!candidate ? 'active' : ''} onClick={() => setMode('recruiter')}>Recruiter</button>
                <button className={candidate ? 'active' : ''} onClick={() => setMode('candidate')}>Candidate-safe</button>
              </div>
              <button className="btn" onClick={() => window.print()}>Print</button>
              <button className="btn teal" onClick={exportDoc}>Word doc</button>
            </div>
          </div>

          <div className="cand-banner">Candidate-safe view — internal strategy, screening rationale, and watch-outs are removed from this copy.</div>

          {/* ===== Job Description ===== */}
          <section id="jd">
            <div className="jd-hero">
              <div className="kick">Job Description</div>
              <div className="title">{M.jd.title}</div>
              {heroFacts.length > 0 && (
                <div className="jd-hero-facts">
                  {heroFacts.map((f, i) => (
                    <div className="f" key={i}><div className="k">{f.k}</div><div className="v">{f.v}</div></div>
                  ))}
                </div>
              )}
            </div>

            <div className="jd-block">
              <div className="bh">Overview</div>
              <p className="jd-sum" style={{ marginBottom: 0 }}>{M.jd.summary}</p>
            </div>

            {(M.jd.summary2 || M.jd.mustHave.length > 0 || M.jd.niceToHave.length > 0) && (
              <>
                <button className={'jd-toggle' + (jdOpen ? ' open' : '')} onClick={() => setJdOpen((v) => !v)}>
                  {jdOpen ? 'Hide full job description' : 'Read the full job description'} <span className="chev">▾</span>
                </button>
                <div className={'jd-more' + (jdOpen ? ' open' : '')}>
                  {M.jd.summary2 && (
                    <div className="jd-block">
                      <div className="bh">More on the role</div>
                      <p className="jd-sum" style={{ marginBottom: 0 }}>{M.jd.summary2}</p>
                    </div>
                  )}
                  {(M.jd.mustHave.length > 0 || M.jd.niceToHave.length > 0) && (
                    <div className="cols">
                      <div className="hilite-box">
                        <div className="mini" style={{ color: 'var(--amber-d)' }}>Must have</div>
                        <ul className="clean">{M.jd.mustHave.map((x, i) => <li key={i}>{x}</li>)}</ul>
                      </div>
                      <div className="plain-box">
                        <div className="mini">Nice to have</div>
                        <ul className="clean">{M.jd.niceToHave.map((x, i) => <li key={i}>{x}</li>)}</ul>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </section>

          {/* ===== What to Look For (internal) ===== */}
          <section id="look" className="int-only">
            <div className="sec-label">What to Look For <span className="int">Internal</span></div>
            {M.lookFor.map((l, i) => (
              <div className="lf" key={i}><div className="sig">{l.signal}</div><div className="det">{l.detail}</div></div>
            ))}
          </section>

          {/* ===== Screening Questions ===== */}
          <section id="questions">
            <div className="sec-label">Screening Questions</div>
            <h2 className="sec-h" style={{ fontSize: 19, marginBottom: 14 }}>Ask, grade, and type your notes live</h2>

            <div className="fitcard int-only">
              <div className="num">{fit.has ? fit.pct : '—'}<small>%</small></div>
              <div className="mid">
                <div className="lab">Live fit score</div>
                <div className="gradeword">{fit.has ? fit.word : 'Grade the answers as you go'}</div>
                <div className="bar"><span style={{ width: (fit.has ? fit.pct : 0) + '%' }} /></div>
              </div>
              <div className="cnt">{fit.count} / {fit.n} graded</div>
            </div>

            {M.questions.map((q, i) => (
              <div className="q" key={i}>
                <div className="qt">{i + 1}. {q.q}</div>
                <div className="surf">Surfaces: {q.surfaces}</div>
                <div className="why int-only"><b>Why we ask</b>{q.internal}</div>
                <div className="grade int-only">
                  <span className="glabel">Grade</span>
                  {[0, 1, 2, 3].map((g) => (
                    <button key={g} data-g={g} className={grades[i] === g ? 'sel' : ''}
                      onClick={() => setGrades((s) => ({ ...s, [i]: g }))}>{GLABEL[g]}</button>
                  ))}
                </div>
                <div className="notes-wrap">
                  <div className="lbl"><span className="live" /> Your notes — type while you talk</div>
                  <textarea placeholder="Great speaking with you… jot the messy notes here. They go straight into the system." />
                </div>
              </div>
            ))}
          </section>

          {/* ===== Target Titles (internal) ===== */}
          <section id="titles" className="int-only">
            <div className="sec-label">Target Titles <span className="int">Internal</span></div>
            {M.targetTitles.map((t, i) => <span className="chip" key={i}>{t}</span>)}
          </section>

          {/* ===== Boolean Search (internal) ===== */}
          <section id="boolean" className="int-only">
            <div className="sec-label">Boolean Search <span className="int">Internal</span></div>
            <div className="bool">{M.boolean}</div>
            <button className="btn" style={{ marginTop: 12 }} onClick={copyBool}>{copied ? 'Copied' : 'Copy string'}</button>
          </section>

          {/* ===== Watch-Outs (internal) ===== */}
          <section id="watch" className="int-only">
            <div className="sec-label">Watch-Outs <span className="int">Internal</span></div>
            {M.watchOuts.map((w, i) => (
              <div className="watch" key={i}><div className="fl">{w.flag}</div><div className="nt">{w.note}</div></div>
            ))}
          </section>
        </div>
      </div>
    </div>
  );
}
