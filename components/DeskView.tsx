/* ============================================================
   The Desk / Dashboard — leadership board over every live role.
   One view: each role's stage on the 10-step flow, who it's waiting
   on, and how many days it's been there. Sorted longest-first.
   (Sample roles for now; plugs into real search data later.)
   ============================================================ */
import React from 'react';
import Link from 'next/link';
import { Lockup } from './ui';

type Wait = 'Sales' | 'Recruiter' | 'Client';
type Role = {
  role: string; client: string;
  stage: number; stageName: string;   // stage is 1..10
  waiting: Wait; days: number; owner: string; note: React.ReactNode;
};

const ROLES: Role[] = [
  { role: 'Chief Risk Officer', client: 'Cascade Bank', stage: 6, stageName: 'Recruiter working the OHMatrix', waiting: 'Recruiter', days: 11, owner: 'J. Okafor',
    note: <>First pass surfaced few regulated-industry CROs, so target titles are widening. <b>No candidates scored yet</b> — worth a check-in with the recruiter.</> },
  { role: 'VP, Finance', client: 'Meridian Health', stage: 5, stageName: 'Client approving the OHMatrix', waiting: 'Client', days: 6, owner: 'R. Bianchi',
    note: <>OHMatrix sent; awaiting the client’s sign-off before sourcing starts. <b>Followed up 2 days ago.</b></> },
  { role: 'Staff Data Engineer', client: 'Orbit Media', stage: 7, stageName: 'Candidates being measured', waiting: 'Recruiter', days: 4, owner: 'J. Okafor',
    note: <><b>4 candidates entered, 2 scored</b> against the approved criteria. Two more screens booked this week.</> },
  { role: 'Director of Operations', client: 'Vela Logistics', stage: 10, stageName: 'Client deciding on the shortlist', waiting: 'Client', days: 3, owner: 'R. Bianchi',
    note: <>Shortlist of 3 sent. Client is reviewing — <b>one marked “advance” so far</b>, two still open.</> },
  { role: 'Technical Product Manager', client: 'Northwind Cloud', stage: 9, stageName: 'Three checks before send', waiting: 'Sales', days: 2, owner: 'M. Cuellar',
    note: <><b>5 candidates scored and recruiter-reviewed.</b> Awaiting sales’ final look before the shortlist goes to Northwind.</> },
  { role: 'Head of Manufacturing', client: 'Atlas Robotics', stage: 4, stageName: 'Sales reviewing the draft OHMatrix', waiting: 'Sales', days: 1, owner: 'R. Bianchi',
    note: <>AI drafted the OHMatrix from the intake notes. <b>Sales reviewing</b> before it goes to the client for approval.</> },
];
const ATTN_DAYS = 8; // flag anything sitting this long or more

export function DeskView() {
  const roles = [...ROLES].sort((a, b) => b.days - a.days);
  const liveCount = roles.length;
  const waitingClient = roles.filter((r) => r.waiting === 'Client').length;
  const waitingUs = liveCount - waitingClient;
  const longest = roles.reduce((m, r) => Math.max(m, r.days), 0);

  return (
    <div className="dsk">
      <div className="topbar">
        <div className="topinner">
          <Lockup sub="Desk" size={24} href="/desk" />
          <div className="spacer" />
          <div className="tabs">
            <a className="on">Desk</a>
            <Link href="/team">Team</Link>
            <Link href="/management">Management</Link>
          </div>
          <Link href="/" className="newbtn"><span className="plus">+</span><span className="lbl">Create new Matrix</span></Link>
          <div className="avatar">MC</div>
        </div>
      </div>

      <div className="wrap">
        <div className="eyebrow">Every live role, one view</div>
        <h1>The <span className="mk">Desk</span></h1>
        <p className="sub">{liveCount} live searches, sorted by days in the current stage — longest first. Days, not adjectives.</p>

        <div className="stats">
          <div className="tile"><div className="l">Live roles</div><div className="v">{liveCount}</div></div>
          <div className="tile"><div className="l">Waiting on the client</div><div className="v">{waitingClient}</div></div>
          <div className="tile"><div className="l">Waiting on us</div><div className="v">{waitingUs}</div></div>
          <div className="tile attn"><div className="l">Longest in stage</div><div className="v">{longest} <small>days</small></div></div>
        </div>

        <span className="boardlabel">The board</span>

        <div className="deck">
          {roles.map((r, i) => {
            const attn = r.days >= ATTN_DAYS;
            const onUs = r.waiting !== 'Client';
            return (
              <div className={'rcard' + (attn ? ' attn' : '')} key={i}>
                <div className="top">
                  <div>
                    <div className="rn">{r.role}</div>
                    <div className="rc">{r.client}</div>
                  </div>
                  <div className="daychip">
                    <span className="n">{r.days}</span>
                    <span className="u">{r.days === 1 ? 'day in stage' : 'days in stage'}</span>
                  </div>
                </div>
                <div className="stageline">
                  <div className="sname"><b>{r.stage} / 10</b>{r.stageName}</div>
                  <div className="rail">
                    {Array.from({ length: 10 }, (_, s) => (
                      <i key={s} className={s < r.stage - 1 ? 'on' : s === r.stage - 1 ? 'cur' : ''} />
                    ))}
                  </div>
                </div>
                <div className="note">{r.note}</div>
                <div className="cardfoot">
                  <span className={'chip ' + (onUs ? 'us' : 'client')}>
                    <span className="d" /> Waiting on {r.waiting}
                  </span>
                  <span className="owner">Owner · <b>{r.owner}</b></span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="foot">Spyglass Matrix · engine: Ollin:Hire · The Desk — leadership view</div>
      </div>
    </div>
  );
}
