'use client';
/* ============================================================
   Spyglass Matrix — Stage 02: the OHMatrix workstation
   Navy sticky rail · JD hero · Recruiter ⇄ Candidate-safe toggle ·
   live grading + fit score · boolean copy · watch-outs · print/Word.
   Wired to the app's Matrix data; internal sections are removed from
   the DOM in the candidate-safe view (not merely hidden), so they
   cannot leak through print, "view source", or the Word export.
   ============================================================ */
import React from 'react';
import type { Matrix } from '@/lib/types';
import { SpyglassMark } from './ui';

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

/* ---------- extraction helpers ---------- */

const esc = (s: unknown) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escBr = (s: unknown) => esc(s).replace(/\n/g, '<br>');

/** Copy that also works on plain http:// origins, where navigator.clipboard is undefined. */
async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch { /* fall through to the legacy path */ }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;top:0;left:-9999px;opacity:0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

/** Save a generated file. The anchor must be in the document for Firefox/Safari to honour it. */
function download(filename: string, mime: string, content: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export type MatrixWorkState = { notes: Record<string, string>; grades: Record<string, number> };

export function MatrixView({
  matrix: M,
  initialWork,
  onWorkChange,
  statusSlot,
}: {
  matrix: Matrix;
  /** Notes/grades to resume from (the workroom loads these from the store). */
  initialWork?: MatrixWorkState;
  /** Fires whenever notes or grades change, so a host can persist them. */
  onWorkChange?: (w: MatrixWorkState) => void;
  /** Rendered in the action bar — e.g. the workroom's save indicator. */
  statusSlot?: React.ReactNode;
}) {
  const [mode, setMode] = React.useState<Mode>('recruiter');
  const [jdOpen, setJdOpen] = React.useState(false);
  const [grades, setGrades] = React.useState<Record<number, number>>(() => {
    const g: Record<number, number> = {};
    for (const [k, v] of Object.entries(initialWork?.grades || {})) g[Number(k)] = v;
    return g;
  });
  const [notes, setNotes] = React.useState<Record<number, string>>(() => {
    const n: Record<number, string> = {};
    for (const [k, v] of Object.entries(initialWork?.notes || {})) n[Number(k)] = v;
    return n;
  });
  const [copied, setCopied] = React.useState('');
  const [active, setActive] = React.useState('jd');
  const candidate = mode === 'candidate';

  // Scrollspy: highlight the rail item for the section in view. Re-runs on mode
  // change because the internal sections leave the DOM in candidate view.
  React.useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) setActive(e.target.id); }),
      { rootMargin: '-20% 0px -70% 0px' },
    );
    NAV.forEach(({ id }) => { const el = document.getElementById(id); if (el) obs.observe(el); });
    return () => obs.disconnect();
  }, [candidate]);

  // Report notes/grades upward so a host can persist them. Skipped on mount so
  // simply opening a matrix never writes back what it just read.
  const mounted = React.useRef(false);
  React.useEffect(() => {
    if (!mounted.current) { mounted.current = true; return; }
    onWorkChange?.({
      notes: Object.fromEntries(Object.entries(notes).map(([k, v]) => [String(k), v])),
      grades: Object.fromEntries(Object.entries(grades).map(([k, v]) => [String(k), v])),
    });
    // onWorkChange is a stable callback from the host; re-running on it would loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notes, grades]);

  const fit = React.useMemo(() => {
    const keys = Object.keys(grades);
    const n = M.questions.length || 1;
    const got = keys.reduce((s, k) => s + grades[Number(k)], 0);
    const pct = Math.round((got / (n * 3)) * 100);
    const word = pct >= 80 ? 'Strong fit' : pct >= 55 ? 'Solid fit' : pct >= 30 ? 'Partial fit' : 'Gap — weak fit';
    return { has: keys.length > 0, pct, word, count: keys.length, n: M.questions.length };
  }, [grades, M.questions.length]);

  const goTo = (id: string) => { document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); };

  const flash = (what: string) => { setCopied(what); setTimeout(() => setCopied(''), 1400); };

  const heroFacts = [
    { k: 'Client', v: M.client },
    { k: 'Location', v: M.location },
    { k: 'Compensation', v: M.salary },
    { k: 'Type', v: M.empType },
  ].filter((f) => !!f.v);
  const metaLine = [M.client, M.empType, M.salary, M.location].filter(Boolean).join(' · ').toUpperCase();
  const slug = (M.jd.title || 'Role').replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-');
  const fileBase = 'Spyglass-Matrix-' + slug + (candidate ? '-Candidate-Safe' : '-Recruiter');

  /* ---------- exports: built from the Matrix data + live state, never scraped
       from innerHTML (which loses typed notes and selected grades) ---------- */

  const buildMarkdown = () => {
    const L: string[] = [];
    L.push('# ' + (M.jd.title || 'Role') + ' — Spyglass Matrix');
    if (metaLine) L.push('', metaLine);
    L.push('', candidate
      ? '_Candidate-safe copy — internal strategy, screening rationale, and watch-outs are excluded._'
      : '_Recruiter copy — CONFIDENTIAL. Contains internal strategy and screening rationale._');

    L.push('', '## Job Description', '', M.jd.summary);
    if (M.jd.summary2) L.push('', M.jd.summary2);
    if (M.jd.mustHave.length) L.push('', '### Must have', ...M.jd.mustHave.map((x) => '- ' + x));
    if (M.jd.niceToHave.length) L.push('', '### Nice to have', ...M.jd.niceToHave.map((x) => '- ' + x));

    if (!candidate && M.lookFor.length) {
      L.push('', '## What to Look For (internal)');
      M.lookFor.forEach((l) => L.push('', '**' + l.signal + '** — ' + l.detail));
    }

    L.push('', '## Screening Questions');
    if (!candidate && fit.has) L.push('', 'Live fit score: ' + fit.pct + '% — ' + fit.word + ' (' + fit.count + '/' + fit.n + ' graded)');
    M.questions.forEach((q, i) => {
      L.push('', (i + 1) + '. ' + q.q);
      L.push('   - Surfaces: ' + q.surfaces);
      if (!candidate) {
        L.push('   - Why we ask: ' + q.internal);
        if (grades[i] !== undefined) L.push('   - Grade: ' + GLABEL[grades[i]]);
        if ((notes[i] || '').trim()) L.push('   - Notes: ' + notes[i].trim().replace(/\n/g, '\n     '));
      }
    });

    if (!candidate) {
      if (M.targetTitles.length) L.push('', '## Target Titles (internal)', '', M.targetTitles.join(' · '));
      if (M.boolean) L.push('', '## Boolean Search (internal)', '', '```', M.boolean, '```');
      if (M.watchOuts.length) {
        L.push('', '## Watch-Outs (internal)');
        M.watchOuts.forEach((w) => L.push('', '**' + w.flag + '** — ' + w.note));
      }
    }
    return L.join('\n') + '\n';
  };

  const buildDocHtml = () => {
    const S: string[] = [];
    S.push('<div class="hero"><div class="kick">Job Description</div><h1>' + esc(M.jd.title) + '</h1>');
    if (metaLine) S.push('<div class="meta">' + esc(metaLine) + '</div>');
    S.push('</div>');
    S.push('<p class="note">' + (candidate
      ? 'Candidate-safe copy — internal strategy, screening rationale, and watch-outs are excluded from this document.'
      : 'Recruiter copy — CONFIDENTIAL. Contains internal strategy and screening rationale. Do not forward to candidates.') + '</p>');

    S.push('<h2>Overview</h2><p>' + escBr(M.jd.summary) + '</p>');
    if (M.jd.summary2) S.push('<h2>More on the role</h2><p>' + escBr(M.jd.summary2) + '</p>');
    if (M.jd.mustHave.length) S.push('<h2>Must have</h2><ul>' + M.jd.mustHave.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul>');
    if (M.jd.niceToHave.length) S.push('<h2>Nice to have</h2><ul>' + M.jd.niceToHave.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul>');

    if (!candidate && M.lookFor.length) {
      S.push('<h2>What to Look For <span class="int">Internal</span></h2>');
      S.push('<table>' + M.lookFor.map((l) =>
        '<tr><th>' + esc(l.signal) + '</th><td>' + esc(l.detail) + '</td></tr>').join('') + '</table>');
    }

    S.push('<h2>Screening Questions</h2>');
    if (!candidate && fit.has) {
      S.push('<p class="fit"><b>Live fit score: ' + fit.pct + '%</b> — ' + esc(fit.word) +
        ' (' + fit.count + ' / ' + fit.n + ' graded)</p>');
    }
    M.questions.forEach((q, i) => {
      S.push('<div class="q"><p class="qt">' + (i + 1) + '. ' + esc(q.q) + '</p>');
      S.push('<p class="surf"><b>Surfaces:</b> ' + esc(q.surfaces) + '</p>');
      if (!candidate) {
        S.push('<p class="why"><b>Why we ask:</b> ' + esc(q.internal) + '</p>');
        if (grades[i] !== undefined) S.push('<p class="gr"><b>Grade:</b> ' + GLABEL[grades[i]] + '</p>');
        S.push('<p class="nt"><b>Notes:</b> ' + (escBr(notes[i]) || '<i>&mdash;</i>') + '</p>');
      }
      S.push('</div>');
    });

    if (!candidate) {
      if (M.targetTitles.length) {
        S.push('<h2>Target Titles <span class="int">Internal</span></h2><p>' +
          M.targetTitles.map((t) => esc(t)).join(' &middot; ') + '</p>');
      }
      if (M.boolean) S.push('<h2>Boolean Search <span class="int">Internal</span></h2><p class="bool">' + esc(M.boolean) + '</p>');
      if (M.watchOuts.length) {
        S.push('<h2>Watch-Outs <span class="int">Internal</span></h2>');
        S.push('<table>' + M.watchOuts.map((w) =>
          '<tr><th class="flag">' + esc(w.flag) + '</th><td>' + esc(w.note) + '</td></tr>').join('') + '</table>');
      }
    }

    const css = [
      'body{font-family:Calibri,Arial,sans-serif;font-size:11pt;color:#1c2430;line-height:1.5}',
      '.hero{border-bottom:3px solid #0E7C84;padding-bottom:10pt;margin-bottom:14pt}',
      '.kick{font-size:8pt;letter-spacing:1.5pt;text-transform:uppercase;color:#0E7C84;font-weight:bold}',
      'h1{font-size:20pt;color:#0A1F3D;margin:4pt 0}',
      '.meta{font-size:8.5pt;letter-spacing:.6pt;color:#5b6777}',
      'h2{font-size:12pt;color:#0A1F3D;margin:16pt 0 6pt;border-bottom:1px solid #dfe4ea;padding-bottom:3pt}',
      '.int{font-size:7.5pt;background:#0A1F3D;color:#fff;padding:1pt 5pt;letter-spacing:.5pt}',
      '.note{font-size:9pt;color:#8C2F3A;font-style:italic}',
      '.fit{background:#0A1F3D;color:#fff;padding:6pt 10pt}',
      '.q{border:1px solid #dfe4ea;padding:8pt 10pt;margin-bottom:8pt}',
      '.qt{font-weight:bold;color:#0A1F3D;margin:0 0 4pt}',
      '.surf,.why,.gr,.nt{margin:3pt 0;font-size:10pt}',
      '.why{color:#0E7C84}.gr{color:#0A1F3D}',
      '.bool{font-family:Consolas,monospace;font-size:9.5pt;background:#f5f6f7;padding:8pt;border:1px solid #dfe4ea}',
      'table{border-collapse:collapse;width:100%}',
      'th{text-align:left;vertical-align:top;width:26%;color:#0A1F3D;padding:5pt 8pt 5pt 0;border-bottom:1px solid #eceff2}',
      'th.flag{color:#8C2F3A}',
      'td{vertical-align:top;padding:5pt 0;border-bottom:1px solid #eceff2}',
      'ul{margin:4pt 0 4pt 16pt}li{margin-bottom:3pt}',
    ].join('');

    return '<html xmlns:o="urn:schemas-microsoft-com:office:office" ' +
      'xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">' +
      '<head><meta charset="utf-8"><title>' + esc(M.jd.title) + ' — Spyglass Matrix</title>' +
      '<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View></w:WordDocument></xml><![endif]-->' +
      '<style>' + css + '</style></head><body>' + S.join('') + '</body></html>';
  };

  const exportDoc = () => {
    // The BOM is what makes Word open this as UTF-8 rather than mojibake.
    download(fileBase + '.doc', 'application/msword', '﻿' + buildDocHtml());
    flash('doc');
  };
  const exportMd = () => {
    download(fileBase + '.md', 'text/markdown;charset=utf-8', buildMarkdown());
    flash('md');
  };
  const copyAll = async () => { flash((await copyText(buildMarkdown())) ? 'all' : 'fail'); };
  const copyBool = async () => { flash((await copyText(M.boolean)) ? 'bool' : 'fail'); };

  return (
    <div className={'mtx' + (candidate ? ' candidate' : '')}>
      <div className="layout">
        {/* ===== Sticky rail ===== */}
        <nav className="nav">
          <div className="brand"><SpyglassMark color="#fff" height={26} /><span className="t">Spyglass <span className="m-caps">Matrix</span></span></div>
          {NAV.filter((it) => !(candidate && it.internal)).map((it) => (
            <a key={it.id} className={active === it.id ? 'on' : ''}
              role="button" tabIndex={0} onClick={() => goTo(it.id)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') goTo(it.id); }}>
              <span className="dot" /> {it.label}
            </a>
          ))}
          <div className="navnote">The rail stays put as you scroll. Internal sections hide in Candidate view.</div>
        </nav>

        {/* ===== Content ===== */}
        <div className="content">
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
              <button className="btn" onClick={copyAll}>{copied === 'all' ? 'Copied' : copied === 'fail' ? 'Copy failed' : 'Copy all'}</button>
              <button className="btn" onClick={exportMd}>{copied === 'md' ? 'Saved' : 'Markdown'}</button>
              <button className="btn teal" onClick={exportDoc}>{copied === 'doc' ? 'Saved' : 'Word doc'}</button>
              {statusSlot}
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

          {/* ===== What to Look For (internal — omitted entirely in candidate view) ===== */}
          {!candidate && (
            <section id="look">
              <div className="sec-label">What to Look For <span className="int">Internal</span></div>
              {M.lookFor.map((l, i) => (
                <div className="lf" key={i}><div className="sig">{l.signal}</div><div className="det">{l.detail}</div></div>
              ))}
            </section>
          )}

          {/* ===== Screening Questions ===== */}
          <section id="questions">
            <div className="sec-label">Screening Questions</div>
            <h2 className="sec-h" style={{ fontSize: 19, marginBottom: 14 }}>Ask, grade, and type your notes live</h2>

            {!candidate && (
              <div className="fitcard">
                <div className="num">{fit.has ? fit.pct : '—'}<small>%</small></div>
                <div className="mid">
                  <div className="lab">Live fit score</div>
                  <div className="gradeword">{fit.has ? fit.word : 'Grade the answers as you go'}</div>
                  <div className="bar"><span style={{ width: (fit.has ? fit.pct : 0) + '%' }} /></div>
                </div>
                <div className="cnt">{fit.count} / {fit.n} graded</div>
              </div>
            )}

            {M.questions.map((q, i) => (
              <div className="q" key={i}>
                <div className="qt">{i + 1}. {q.q}</div>
                <div className="surf">Surfaces: {q.surfaces}</div>
                {!candidate && (
                  <>
                    <div className="why"><b>Why we ask</b>{q.internal}</div>
                    <div className="grade">
                      <span className="glabel">Grade</span>
                      {[0, 1, 2, 3].map((g) => (
                        <button key={g} data-g={g} className={grades[i] === g ? 'sel' : ''}
                          onClick={() => setGrades((s) => ({ ...s, [i]: g }))}>{GLABEL[g]}</button>
                      ))}
                    </div>
                    <div className="notes-wrap">
                      <div className="lbl"><span className="live" /> Your notes — type while you talk</div>
                      <textarea
                        value={notes[i] || ''}
                        onChange={(e) => setNotes((s) => ({ ...s, [i]: e.target.value }))}
                        placeholder="Great speaking with you… jot the messy notes here. They go straight into the system." />
                      {/* A textarea clips to its box on paper, so print from a plain div instead. */}
                      <div className="notes-print">{notes[i] || '—'}</div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </section>

          {/* ===== Target Titles (internal) ===== */}
          {!candidate && (
            <section id="titles">
              <div className="sec-label">Target Titles <span className="int">Internal</span></div>
              {M.targetTitles.map((t, i) => <span className="chip" key={i}>{t}</span>)}
            </section>
          )}

          {/* ===== Boolean Search (internal) ===== */}
          {!candidate && (
            <section id="boolean">
              <div className="sec-label">Boolean Search <span className="int">Internal</span></div>
              <div className="bool">{M.boolean}</div>
              <button className="btn" style={{ marginTop: 12 }} onClick={copyBool}>
                {copied === 'bool' ? 'Copied' : copied === 'fail' ? 'Copy failed' : 'Copy string'}
              </button>
            </section>
          )}

          {/* ===== Watch-Outs (internal) ===== */}
          {!candidate && (
            <section id="watch">
              <div className="sec-label">Watch-Outs <span className="int">Internal</span></div>
              {M.watchOuts.map((w, i) => (
                <div className="watch" key={i}><div className="fl">{w.flag}</div><div className="nt">{w.note}</div></div>
              ))}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
