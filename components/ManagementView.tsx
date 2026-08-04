'use client';
/* ============================================================
   The Management view — birds-eye across the company. Pick any
   recruiter from the roster and drill into their quarter: activity,
   submissions by job, placements, and revenue.
   (Sample data for now; plugs into real numbers later.)
   ============================================================ */
import React from 'react';
import Link from 'next/link';
import { Lockup } from './ui';

type Out = 'placed' | 'review' | 'pass';
type Sub = { n: number; job: string; client: string; out: Out };
type Member = {
  key: string; name: string; first: string; initials: string; role: string;
  calls: number; meetings: number; submitted: number; filled: number; revenue: string; subs: Sub[];
};

const OUT_LABEL: Record<Out, string> = { placed: 'Placed', review: 'In review', pass: 'Passed' };

const TEAM: Member[] = [
  { key: 'marcos', name: 'Marcos Cuellar', first: 'Marcos', initials: 'MC', role: 'Senior Recruiter',
    calls: 42, meetings: 11, submitted: 9, filled: 3, revenue: '$142,000',
    subs: [
      { n: 3, job: 'Technical Product Manager', client: 'Northwind Cloud', out: 'placed' },
      { n: 2, job: 'Senior Product Manager', client: 'Vantage Labs', out: 'review' },
      { n: 2, job: 'Staff Software Engineer', client: 'Helio Systems', out: 'review' },
      { n: 2, job: 'Product Designer', client: 'Northwind Cloud', out: 'pass' },
    ] },
  { key: 'mike', name: 'Mike Chapman', first: 'Mike', initials: 'MC', role: 'Account Manager',
    calls: 31, meetings: 14, submitted: 6, filled: 2, revenue: '$98,500',
    subs: [
      { n: 2, job: 'Engineering Manager', client: 'Brightpath AI', out: 'placed' },
      { n: 3, job: 'Backend Engineer', client: 'Vantage Labs', out: 'review' },
      { n: 1, job: 'QA Lead', client: 'Helio Systems', out: 'pass' },
    ] },
  { key: 'luke', name: 'Luke Gendron', first: 'Luke', initials: 'LG', role: 'Recruiter',
    calls: 27, meetings: 8, submitted: 5, filled: 1, revenue: '$61,000',
    subs: [
      { n: 2, job: 'Data Platform Lead', client: 'Cobalt Software', out: 'review' },
      { n: 2, job: 'Frontend Engineer', client: 'Brightpath AI', out: 'placed' },
      { n: 1, job: 'Product Analyst', client: 'Northwind Cloud', out: 'pass' },
    ] },
];

export function ManagementView() {
  const [selKey, setSelKey] = React.useState('marcos');
  const t = TEAM.find((m) => m.key === selKey) || TEAM[0];

  return (
    <div className="mg">
      <div className="topbar">
        <div className="topinner">
          <Lockup sub="Management" size={24} />
          <div className="spacer" />
          <div className="tabs">
            <Link href="/desk">Desk</Link>
            <Link href="/team">Team</Link>
            <a className="on">Management</a>
          </div>
          <Link href="/" className="newbtn"><span className="plus">+</span><span className="lbl">Create new Matrix</span></Link>
          <div className="avatar">MC</div>
        </div>
      </div>

      <div className="wrap">
        <div className="eyebrow">How the company is doing</div>
        <h1>The whole company, <span className="mk">one level down</span>.</h1>
        <p className="sub">Pick any recruiter to see their activity, submissions, placements, and revenue this quarter.</p>

        <div className="layout">
          <div className="card">
            <div className="card-h">The team · Q3</div>
            <div>
              {TEAM.map((m) => (
                <button className={'rec' + (m.key === selKey ? ' sel' : '')} key={m.key} onClick={() => setSelKey(m.key)}>
                  <span className="av">{m.initials}</span>
                  <div>
                    <div className="nm">{m.first}</div>
                    <div className="rl">{m.role}</div>
                  </div>
                  <span className="rev">{m.revenue}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="detail">
            <div className="dhead">
              <span className="av">{t.initials}</span>
              <div>
                <div className="nm">{t.name}</div>
                <div className="rl">{t.role}</div>
              </div>
              <span className="period">Quarter to date</span>
            </div>

            <div className="dstats">
              <div className="tile"><div className="k">Clients called</div><div className="v">{t.calls}</div></div>
              <div className="tile"><div className="k">Client meetings</div><div className="v">{t.meetings}</div></div>
              <div className="tile"><div className="k">Candidates submitted</div><div className="v">{t.submitted}</div></div>
              <div className="tile"><div className="k">Jobs filled</div><div className="v">{t.filled}</div></div>
              <div className="tile hi"><div className="k">Revenue</div><div className="v rev">{t.revenue}</div></div>
            </div>

            <div className="block-h">Submissions by job</div>
            <ul className="sub-list">
              {t.subs.map((s, i) => (
                <li key={i}>
                  <span className="badge">{s.n} →</span>
                  <span className="job"><b>{s.job}</b> · {s.client}</span>
                  <span className={'out ' + s.out}>{OUT_LABEL[s.out]}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="foot">Spyglass Matrix · engine: Ollin:Hire · Management view — company overview · Q3 2026</div>
      </div>
    </div>
  );
}
