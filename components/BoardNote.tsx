'use client';
/* ============================================================
   A shared, persistent team note on a Desk role card. Autosaves
   on blur to /api/board-notes so the whole team sees the same
   note the next time they open the board.
   ============================================================ */
import React from 'react';
import type { BoardNote as BoardNoteData } from '@/lib/store';

function ago(iso: string): string {
  if (!iso) return '';
  const s = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60); if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24); return `${d}d ago`;
}

export function BoardNote({ noteKey, initial }: { noteKey: string; initial?: BoardNoteData }) {
  const [note, setNote] = React.useState(initial?.note || '');
  const [by, setBy] = React.useState(initial?.by || '');
  const [at, setAt] = React.useState(initial?.at || '');
  const [status, setStatus] = React.useState<'idle' | 'saving' | 'saved'>('idle');
  const savedRef = React.useRef(initial?.note || '');

  const save = async () => {
    if (note === savedRef.current) return;
    setStatus('saving');
    try {
      const res = await fetch('/api/board-notes', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ key: noteKey, note }),
      });
      const data = await res.json();
      if (res.ok) {
        savedRef.current = note;
        setBy(data.saved?.by || by);
        setAt(data.saved?.at || new Date().toISOString());
        setStatus('saved');
        setTimeout(() => setStatus('idle'), 1600);
      } else { setStatus('idle'); }
    } catch { setStatus('idle'); }
  };

  const meta = status === 'saving' ? 'Saving…'
    : status === 'saved' ? 'Saved ✓'
    : by ? `${by} · ${ago(at)}`
    : 'Shared with the team';

  return (
    <div className="teamnote">
      <div className="tn-label">Team notes <span className="tn-shared">shared</span></div>
      <textarea
        className="tn-ta"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        onBlur={save}
        placeholder="Add a note the whole team will see — next step, who to chase, context…"
        rows={2}
      />
      <div className={'tn-meta' + (status === 'saved' ? ' ok' : '')}>{meta}</div>
    </div>
  );
}
