/* ============================================================
   The Team Dashboard — management's view of how the team is doing.
   Revenue, placements, the recruiter leaderboard, and every live
   search across the team. Rolls up the individual /desk views.
   (Sample data for now; plugs into real numbers later.)
   ============================================================ */
import React from 'react';
import Link from 'next/link';
import { Lockup } from './ui';
import { UserMenu } from './UserMenu';

type Rec = { rank: number; name: string; initials: string; calls: number; subs: number; placed: number; rev: string; barPct: number; first: string };
const RECRUITERS: Rec[] = [
  { rank: 1, name: 'Marcos Cuellar', initials: 'MC', calls: 42, subs: 9, placed: 3, rev: '$142.0k', barPct: 100, first: 'Marcos' },
  { rank: 2, name: 'Mike Chapman', initials: 'MC', calls: 31, subs: 6, placed: 2, rev: '$98.5k', barPct: 69, first: 'Mike' },
  { rank: 3, name: 'Luke Gendron', initials: 'LG', calls: 27, subs: 5, placed: 1, rev: '$61.0k', barPct: 43, first: 'Luke' },
];

type Search = { role: string; client: string; owner: string; stage: string; tone?: 'live' | 'new' };
const SEARCHES: Search[] = [
  { role: 'Technical Product Manager', client: 'Northwind Cloud', owner: 'MARCOS', stage: 'Client review', tone: 'live' },
  { role: 'Senior Product Manager', client: 'Vantage Labs', owner: 'MARCOS', stage: 'Shortlist sent', tone: 'live' },
  { role: 'Engineering Manager', client: 'Brightpath AI', owner: 'MIKE', stage: 'Placed', tone: 'live' },
  { role: 'Backend Engineer', client: 'Vantage Labs', owner: 'MIKE', stage: 'Screening' },
  { role: 'Data Platform Lead', client: 'Cobalt Software', owner: 'LUKE', stage: 'New brief', tone: 'new' },
  { role: 'Staff Software Engineer', client: 'Helio Systems', owner: 'MARCOS', stage: 'Sourcing' },
];

export function TeamView() {
  return (
    <div className="tm">
      <div className="topbar">
        <div className="topinner">
          <Lockup sub="Team" size={24} href="/desk" />
          <div className="spacer" />
          <div className="tabs">
            <Link href="/desk">Desk</Link>
            <a className="on">Team</a>
            <Link href="/management">Management</Link>
          </div>
          <Link href="/" className="newbtn"><span className="plus">+</span><span className="lbl">Create new Matrix</span></Link>
          <UserMenu />
        </div>
      </div>

      <div className="wrap">
        <div className="eyebrow">How the team is doing</div>
        <h1>The whole team, <span className="mk">one screen</span>.</h1>
        <p className="sub">Team performance at a glance — every recruiter, every live search, rolled up from their desks.</p>

        <div className="stats">
          <div className="tile hi"><div className="k">Revenue · Q3</div><div className="v rev">$301.5k</div><div className="d"><span className="up">78%</span> to target</div></div>
          <div className="tile"><div className="k">Placements</div><div className="v">6</div><div className="d">of 9 target</div></div>
          <div className="tile"><div className="k">Active searches</div><div className="v">6</div><div className="d">across 3 recruiters</div></div>
          <div className="tile"><div className="k">Candidates in play</div><div className="v">23</div><div className="d">8 client-ready</div></div>
          <div className="tile"><div className="k">Avg. time to fill</div><div className="v">31<small>d</small></div><div className="d"><span className="up">−4d</span> vs. Q2</div></div>
        </div>

        <div className="grid">
          <div className="card">
            <div className="card-h"><span className="t">Recruiter leaderboard</span><span className="meta">Q3</span></div>
            {RECRUITERS.map((r) => (
              <div className="lead" key={r.name}>
                <span className="rank">{r.rank}</span>
                <span className="av">{r.initials}</span>
                <div>
                  <div className="nm">{r.name}</div>
                  <div className="mini">{r.calls} calls · {r.subs} subs · {r.placed} placed</div>
                </div>
                <div className="rev">
                  <div className="r">{r.rev}</div>
                  <div className="p">{r.placed} PLACEMENT{r.placed === 1 ? '' : 'S'}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="card">
            <div className="card-h"><span className="t">Revenue by recruiter</span><span className="meta">Q3 · $</span></div>
            <div className="bars">
              {RECRUITERS.map((r) => (
                <div className="bar-row" key={r.name}>
                  <span className="lbl">{r.first}</span>
                  <span className="track"><span style={{ width: `${r.barPct}%` }} /></span>
                  <span className="amt">{r.rev}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card" style={{ marginTop: 18 }}>
          <div className="card-h"><span className="t">Active searches · all recruiters</span><span className="meta">6 live</span></div>
          {SEARCHES.map((s, i) => (
            <div className="eng" key={i}>
              <div className="role"><div className="r">{s.role}</div><div className="c">{s.client}</div></div>
              <span className="own">{s.owner}</span>
              <span className={'stage' + (s.tone ? ' ' + s.tone : '')}>{s.stage}</span>
            </div>
          ))}
        </div>

        <div className="foot">Spyglass Matrix · engine: Ollin:Hire · Team dashboard — management view · Q3 2026</div>
      </div>
    </div>
  );
}
