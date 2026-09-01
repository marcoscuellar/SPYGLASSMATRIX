'use client';
/* ============================================================
   Spyglass Matrix — workroom index
   The roles the team can work on. Shows how far each one has been
   screened so a recruiter can pick up where someone left off.
   ============================================================ */
import React from 'react';
import type { StoredMatrix } from '@/lib/types';
import { SpyglassMark } from './ui';

function when(iso: string | null): string {
  if (!iso) return 'Not started';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'Not started';
  const mins = Math.round((Date.now() - d.getTime()) / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function WorkroomList({ matrices, persistent }: { matrices: StoredMatrix[]; persistent: boolean }) {
  const lock = async () => {
    await fetch('/api/workroom/lock', { method: 'POST' }).catch(() => {});
    window.location.reload();
  };

  return (
    <div className="wr">
      <div className="wrtop">
        <div className="brand"><SpyglassMark color="var(--navy)" height={24} /><span className="name">Recruiter <span className="mk">Workroom</span></span></div>
        <span className="spacer" />
        <button className="lockbtn" onClick={lock}>Lock this device</button>
      </div>

      <div className="wrwrap">
        <div className="eyebrow">Open searches</div>
        <h1>Pick a role to <span className="mk">work</span></h1>
        <p className="sub">
          Your notes and grades save as you type, so anyone on the team can pick up a screen
          mid-flight.
        </p>

        {!persistent && (
          <div className="warn">
            No database is configured, so notes are held in server memory and will be lost when the
            app restarts. Set <code>POSTGRES_URL</code> to make them durable.
          </div>
        )}

        {matrices.length === 0 ? (
          <div className="empty">No matrices saved yet.</div>
        ) : (
          <div className="deck">
            {matrices.map((m) => {
              const graded = Object.keys(m.work.grades || {}).length;
              const total = m.matrix.questions.length;
              const noted = Object.values(m.work.notes || {}).filter((n) => (n || '').trim()).length;
              return (
                <a className="mcard" key={m.id} href={`/workroom/${m.id}`}>
                  <div className="top">
                    <div>
                      <div className="rn">{m.matrix.jd.title}</div>
                      {m.matrix.client && <div className="rc">{m.matrix.client}</div>}
                    </div>
                    <span className="pill">{graded} / {total}</span>
                  </div>
                  <div className="facts">
                    {[m.matrix.empType, m.matrix.salary, m.matrix.location].filter(Boolean).join(' · ')}
                  </div>
                  <div className="rail">
                    {Array.from({ length: total }).map((_, i) => (
                      <i key={i} className={m.work.grades?.[String(i)] !== undefined ? 'on' : ''} />
                    ))}
                  </div>
                  <div className="foot">
                    <span>{noted > 0 ? `${noted} question${noted === 1 ? '' : 's'} noted` : 'No notes yet'}</span>
                    <span className="ago">{when(m.work.updatedAt)}</span>
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
