'use client';
/* ============================================================
   Spyglass Matrix — workroom workspace
   Wraps the Matrix document with autosave. Notes and grades are
   debounced and PUT to the store, so a recruiter can close the tab
   mid-screen and the next person picks up exactly where they left off.
   ============================================================ */
import React from 'react';
import type { StoredMatrix } from '@/lib/types';
import { MatrixView, type MatrixWorkState } from './MatrixView';
import { SubmitPanel } from './SubmitPanel';

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

export function WorkroomMatrix({ stored }: { stored: StoredMatrix }) {
  const [state, setState] = React.useState<SaveState>('idle');
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const pending = React.useRef<MatrixWorkState | null>(null);
  const inFlight = React.useRef(false);

  const flush = React.useCallback(async () => {
    if (inFlight.current || !pending.current) return;
    const payload = pending.current;
    pending.current = null;
    inFlight.current = true;
    setState('saving');
    try {
      const res = await fetch('/api/workroom/work', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id: stored.id, ...payload }),
      });
      setState(res.ok ? 'saved' : 'error');
    } catch {
      setState('error');
    }
    inFlight.current = false;
    // Anything typed while that request was open still needs sending.
    if (pending.current) flush();
  }, [stored.id]);

  const onWorkChange = React.useCallback((w: MatrixWorkState) => {
    pending.current = w;
    setState('saving');
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(flush, 700);
  }, [flush]);

  // Don't lose the last keystrokes if they close the tab mid-debounce.
  React.useEffect(() => {
    const bail = () => {
      if (!pending.current) return;
      try {
        navigator.sendBeacon?.(
          '/api/workroom/work',
          new Blob([JSON.stringify({ id: stored.id, ...pending.current })], { type: 'application/json' }),
        );
      } catch { /* best effort */ }
    };
    window.addEventListener('pagehide', bail);
    return () => { window.removeEventListener('pagehide', bail); if (timer.current) clearTimeout(timer.current); };
  }, [stored.id]);

  const label =
    state === 'saving' ? 'Saving…' :
    state === 'saved' ? 'Saved' :
    state === 'error' ? 'Not saved — retrying' : '';

  return (
    <div className="frame-pad">
      <a href="/workroom" className="print-hide wrback">← All searches</a>
      <MatrixView
        matrix={stored.matrix}
        initialWork={{ notes: stored.work.notes || {}, grades: stored.work.grades || {} }}
        onWorkChange={onWorkChange}
        statusSlot={label ? <span className={'savechip print-hide ' + state}>{label}</span> : null}
      />
      <SubmitPanel matrixId={stored.id} roleTitle={stored.matrix.jd.title} />
    </div>
  );
}
