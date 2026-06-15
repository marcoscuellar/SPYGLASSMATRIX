'use client';
/* ============================================================
   Spyglass Matrix — Job-description typesetter
   The submitted JD is preserved verbatim, but instead of dumping
   it as raw pre-wrap text we lightly structure it: a title, a
   meta line, section headings (ROLE SUMMARY, MUST-HAVES…), and
   real bullet / numbered lists. Content is unchanged — only the
   presentation is designed.
   ============================================================ */
import React from 'react';

type Block =
  | { t: 'title'; text: string }
  | { t: 'meta'; text: string }
  | { t: 'heading'; text: string }
  | { t: 'p'; text: string }
  | { t: 'list'; ordered: boolean; items: string[] };

function isHeading(s: string): boolean {
  const letters = s.replace(/[^A-Za-z]/g, '');
  if (letters.length < 2 || s.length > 48) return false;
  const upper = s.replace(/[^A-Z]/g, '').length;
  return upper / letters.length > 0.7 && !/[.!?:]$/.test(s);
}

function parseJd(raw: string): Block[] {
  const lines = raw.replace(/\r/g, '').split('\n');
  const blocks: Block[] = [];
  let para: string[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;
  let titleDone = false;
  let metaDone = false;

  const flushPara = () => { if (para.length) { blocks.push({ t: 'p', text: para.join(' ') }); para = []; } };
  const flushList = () => { if (list) { blocks.push({ t: 'list', ordered: list.ordered, items: list.items }); list = null; } };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) { flushPara(); flushList(); continue; }

    if (!titleDone) { titleDone = true; blocks.push({ t: 'title', text: line }); continue; }

    const bulletM = line.match(/^[•\-–•\*]\s+(.*)$/);
    const numM = line.match(/^(\d+)[.)]\s+(.*)$/);

    if (bulletM) {
      flushPara();
      if (!list || list.ordered) { flushList(); list = { ordered: false, items: [] }; }
      list.items.push(bulletM[1]);
      continue;
    }
    if (numM) {
      flushPara();
      if (!list || !list.ordered) { flushList(); list = { ordered: true, items: [] }; }
      list.items.push(numM[2]);
      continue;
    }

    flushList();

    if (isHeading(line)) { flushPara(); blocks.push({ t: 'heading', text: line }); metaDone = true; continue; }
    if (!metaDone && para.length === 0 && /·|\|/.test(line) && line.length < 70) {
      blocks.push({ t: 'meta', text: line }); metaDone = true; continue;
    }

    para.push(line);
  }
  flushPara(); flushList();
  return blocks;
}

export function JdDocument({ text }: { text: string }) {
  const blocks = React.useMemo(() => parseJd(text), [text]);
  return (
    <div style={{ marginTop: 6, padding: '24px 26px', background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 'var(--r-4)' }}>
      {blocks.map((b, i) => {
        if (b.t === 'title') {
          return <div key={i} style={{ fontFamily: "'Geist', sans-serif", fontWeight: 700, fontSize: 19, letterSpacing: '-0.02em', lineHeight: 1.3, color: 'var(--ink)', marginBottom: 4 }}>{b.text}</div>;
        }
        if (b.t === 'meta') {
          return <div key={i} className="t-mono-xs" style={{ color: 'var(--ink-3)', marginBottom: 18 }}>{b.text}</div>;
        }
        if (b.t === 'heading') {
          return <div key={i} className="t-mono-xs t-section-label" style={{ marginTop: i === 0 ? 0 : 22, marginBottom: 10 }}>{b.text}</div>;
        }
        if (b.t === 'p') {
          return <p key={i} className="t-body" style={{ fontSize: 15.5, color: 'var(--ink-2)', lineHeight: 1.65, margin: '0 0 12px' }}>{b.text}</p>;
        }
        // list
        return (
          <ul key={i} style={{ margin: '0 0 14px', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 9 }}>
            {b.items.map((it, j) => (
              <li key={j} style={{ display: 'flex', gap: 12, fontFamily: "'Geist', sans-serif", fontSize: 15.5, lineHeight: 1.55, color: 'var(--ink-2)' }}>
                <span style={{ color: b.ordered ? 'var(--ink-3)' : 'var(--ink-4)', paddingTop: 1, flexShrink: 0, fontFamily: b.ordered ? "'Geist Mono', monospace" : 'inherit', fontSize: b.ordered ? 13 : 'inherit', minWidth: b.ordered ? 16 : 'auto' }}>
                  {b.ordered ? `${j + 1}.` : '—'}
                </span>
                <span>{it}</span>
              </li>
            ))}
          </ul>
        );
      })}
    </div>
  );
}
