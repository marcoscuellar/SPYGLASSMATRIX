'use client';
/* ============================================================
   Spyglass Matrix — the submissions desk (internal)
   Where "Submit to Marcos" lands. Login-only: these carry
   candidates' names, screening notes, and résumés.
   ============================================================ */
import React from 'react';
import type { Submission } from '@/lib/types';
import { SpyglassMark } from './ui';

const LABEL: Record<string, string> = { advance: 'Advance', fence: 'On the fence', pass: 'Pass' };

function when(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const mins = Math.round((Date.now() - d.getTime()) / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  if (mins < 1440) return `${Math.round(mins / 60)} hr ago`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function SubmissionsView({ subs, mailOn }: { subs: Submission[]; mailOn: boolean }) {
  const [filter, setFilter] = React.useState<string>('all');
  const shown = filter === 'all' ? subs : subs.filter((s) => s.read === filter);
  const count = (k: string) => subs.filter((s) => s.read === k).length;

  return (
    <div className="subs">
      <div className="topbar">
        <div className="brand"><SpyglassMark color="var(--navy)" height={24} /><span className="name">Submissions <span className="mk">Desk</span></span></div>
        <span className="spacer" />
        <a className="link" href="/desk">← Desk</a>
      </div>

      <div className="wrap">
        <div className="eyebrow">From the workroom</div>
        <h1>What your recruiters <span className="mk">sent you</span></h1>
        <p className="sub">Every screen submitted from a Matrix, newest first. Clients never see this.</p>

        {!mailOn && subs.length > 0 && (
          <div className="warn">
            Email notifications are off, so submissions only appear here. Set <code>RESEND_API_KEY</code>{' '}
            and <code>SUBMISSIONS_EMAIL_TO</code> to also get them in your inbox.
          </div>
        )}

        {subs.length === 0 ? (
          <div className="empty">
            Nothing submitted yet. Recruiters send candidates from the bottom of a Matrix in the workroom.
          </div>
        ) : (
          <>
            <div className="filters">
              {[['all', `All (${subs.length})`], ['advance', `Advance (${count('advance')})`], ['fence', `On the fence (${count('fence')})`], ['pass', `Pass (${count('pass')})`]].map(([k, t]) => (
                <button key={k} className={filter === k ? 'on' : ''} onClick={() => setFilter(k)}>{t}</button>
              ))}
            </div>

            <div className="list">
              {shown.map((s) => (
                <article className="scard" key={s.id}>
                  <div className="head">
                    <div>
                      <div className="cn">{s.candidateName}</div>
                      <div className="role">{s.roleTitle}{s.client ? ` · ${s.client}` : ''}</div>
                    </div>
                    <span className={'verdict ' + s.read}>{LABEL[s.read] || s.read}</span>
                  </div>
                  {s.notes && <div className="notes">{s.notes}</div>}
                  <div className="foot">
                    <span className="from">
                      {s.recruiterName} · <a href={`mailto:${s.recruiterEmail}?subject=${encodeURIComponent(s.candidateName + ' — ' + s.roleTitle)}`}>{s.recruiterEmail}</a>
                    </span>
                    <span className="right">
                      {s.resume
                        ? <a className="dl" href={`/api/submissions/${s.id}/resume`}>Résumé · {s.resume.filename}</a>
                        : <span className="nores">No résumé</span>}
                      <span className="ago">{when(s.createdAt)}</span>
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
