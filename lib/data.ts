/* ============================================================
   Spyglass Matrix — sample data
   The bundled fallback Matrix + the client-side candidate
   shortlist, AI dossiers, and signal scoring metadata.
   Ported from the handoff's app/data.jsx + app/flow-data.jsx.
   ============================================================ */

import type { Candidate, Matrix, ScoreKey } from './types';

// The fully-detailed engagement: Meridian — Senior Tax Manager.
// Used as the graceful fallback when no LLM key is configured.
export const MATRIX: Matrix = {
  intake: {
    meetingDate: 'Jun 6, 2026',
    attendees: ['Dana Holt (Spyglass, AM)', 'Karen Liu (Meridian, Partner)', 'Rob Vance (Meridian, Tax Director)'],
    statedNeed:
      'Lead the private-client tax practice — own complex returns for the firm’s ultra-high-net-worth households and mentor a small associate team.',
    softSkills: [
      { label: 'Client-facing polish', note: 'Sits across from UHNW families. Must read a room, not just a return.' },
      { label: 'Mentor, not just doer', note: 'Three junior associates need shaping. The hire grows the bench.' },
      { label: 'Calm in busy season', note: 'April is brutal here. They want steady, not heroics.' },
    ],
    internalNotes: [
      { tag: 'Confidential', note: 'Current manager is exiting in Q3 — not yet announced internally. Do not reference.' },
      { tag: 'Comp', note: 'Client floated $160k but will move to $185k for the right profile. Hold this back.' },
      { tag: 'Risk', note: 'Lost two hires in 18 months. Culture runs intense. Screen hard for resilience + stability.' },
    ],
  },
  jd: {
    title: 'Senior Tax Manager',
    summary:
      'Meridian Wealth Advisors is seeking a Senior Tax Manager to lead tax strategy and compliance for our private-client practice. You will own the most complex engagements, review the work of junior staff, and partner directly with clients and advisors.',
    summary2:
      'This is a senior, client-facing seat on a tight-knit private-client team. You will set the standard for technical quality, carry the firm’s most sensitive ultra-high-net-worth households, and build the bench beneath you as the practice grows through busy season and beyond.',
    mustHave: [
      'CPA required; 8+ years in public accounting or private client tax.',
      'Deep experience with HNW / UHNW individual and trust taxation.',
      'Demonstrated team leadership or mentoring experience.',
      'Multi-state return experience.',
    ],
    niceToHave: [
      'Exposure to family-office or estate-planning structures.',
      'Experience with partnership K-1s and pass-through entities.',
      'Background in a fee-based wealth advisory environment.',
      'Active in a professional network (AICPA, state society).',
    ],
  },
  lookFor: [
    { signal: 'Owned complexity', detail: 'Personally owned UHNW / multi-state returns — not just supervised.' },
    { signal: 'Real mentoring', detail: 'Concrete examples of growing junior staff, not just "managed a team."' },
    { signal: 'Stability', detail: 'No pattern of < 2-year stints. Their retention problem makes this non-negotiable.' },
    { signal: 'Composure', detail: 'Evidence of staying measured under deadline pressure and difficult clients.' },
  ],
  questions: [
    {
      q: 'Walk me through the most complex return you have personally owned end-to-end.',
      surfaces: 'Depth of hands-on complexity',
      internal: 'Probe for UHNW + multi-state specifically. If they pivot to "my team handled it," that is a flag.',
    },
    {
      q: 'Tell me about a junior associate you developed. Where are they now?',
      surfaces: 'Genuine mentoring vs. delegation',
      internal: 'Client is buying a bench-builder. Vague answers here = wrong profile.',
    },
    {
      q: 'Describe a busy season that went sideways. What did you do?',
      surfaces: 'Composure under pressure',
      internal: 'Listen for steadiness over heroics. They are tired of burnout culture.',
    },
    {
      q: 'A client disputes your tax position in a meeting. Walk me through it.',
      surfaces: 'Client-facing judgment',
      internal: 'These are UHNW families. Bedside manner matters as much as being right.',
    },
  ],
  targetTitles: [
    'Senior Tax Manager', 'Tax Manager (UHNW)', 'Private Client Tax Manager',
    'Trust & Estate Tax Manager', 'Family Office Tax Lead',
  ],
  boolean:
    '("Senior Tax Manager" OR "Tax Manager") AND (UHNW OR "high net worth" OR "private client" OR trust) AND CPA AND (mentor* OR "develop* staff" OR lead*) NOT (intern OR junior OR seasonal)',
  watchOuts: [
    { flag: 'Job-hopping pattern', note: 'Two failed hires already. Anything under ~2-year stints gets pressure-tested on stability.' },
    { flag: 'Pure preparer profile', note: 'A heads-down doer with no mentoring story is the wrong shape — the client is buying a bench-builder.' },
  ],
};

export const SCORE_META: Record<ScoreKey, { label: string; dots: number; color: string }> = {
  strong:  { label: 'Strong',  dots: 3, color: 'var(--navy)' },
  solid:   { label: 'Solid',   dots: 2, color: 'var(--ink)' },
  partial: { label: 'Partial', dots: 1, color: 'var(--ink-3)' },
  gap:     { label: 'Gap',     dots: 0, color: 'var(--ink-4)' },
};

export const CANDS: Candidate[] = [
  {
    id: 'eleanor-pace',
    name: 'Eleanor Pace', initials: 'EP', fit: 91, stage: 'Client Ready',
    role: 'Tax Manager', company: 'Beacon Private Wealth', years: 11,
    location: 'Boston, MA', compExp: '$178–185k', avail: '6-week notice',
    tags: ['UHNW', 'CPA · MST', '11 yrs'],
    approval: 'approved',
    blurb: 'The shape of the role, almost exactly. Owns a UHNW book and has built a bench.',
    dossier: {
      headline: 'A private-client tax lead who already runs the room.',
      writeup: {
        intro:
          'Eleanor is the closest match to your brief we found — a private-client tax lead who already does, day to day, exactly what this seat requires. For eleven years she has owned the most complex UHNW and multi-generational returns at a Boston wealth firm, and for the last four she has run the associate pod beneath her. She is leaving only because her current firm froze its partner track, so the ownership Meridian is offering is precisely what she is looking for next.',
        fit: [
          'Owns complexity you can’t teach — multi-state and trust returns for a ~$40M-AUM book of UHNW families, end to end, not just in review.',
          'Already a bench-builder — she built a three-person associate pod from scratch and has had two reports promoted under her, which is the mentoring mandate this role is really about.',
          'Steady where it counts — eleven years across two firms, no job-hopping, and references that independently call her “unflappable” in busy season.',
        ],
        cta:
          'If you see one candidate this week, make it Eleanor. She’s passive, interviewing nowhere else yet, and profiles like hers don’t sit on the market — let’s get her in front of your team before that changes.',
      },
      summary:
        'Eleanor has spent eleven years in private-client tax, the last four leading a three-person associate pod at a Boston wealth firm. She owns the most complex returns for a book of UHNW families and is known for being unflappable with both clients and deadlines.',
      highlights: [
        'Owns ~$40M-AUM book of UHNW and multi-generational family returns end-to-end.',
        'Built and developed a 3-person associate pod — two promoted under her.',
        'CPA + Master of Science in Taxation; deep trust & multi-state experience.',
        'Reputation for calm, measured client meetings even in peak season.',
      ],
      signals: [
        { signal: 'Owned complexity', score: 'strong', evidence: 'Personally owns multi-state + trust returns for the firm’s largest households.' },
        { signal: 'Real mentoring',   score: 'strong', evidence: 'Built the associate pod from scratch; two direct reports promoted.' },
        { signal: 'Stability',        score: 'solid',  evidence: '11 yrs across two firms — long tenures, no hopping. Passive, not actively looking.' },
        { signal: 'Composure',        score: 'strong', evidence: 'Screened twice; reads as genuinely steady. References echo "never rattled."' },
      ],
      internalNotes: [
        { tag: 'Comp', note: 'Anchored at $178k but movable. We have room to $185k — do not lead with the ceiling.' },
        { tag: 'Motivation', note: 'Leaving because her firm froze the partner track. Wants ownership of a practice. Meridian’s pitch lands here.' },
        { tag: 'Logistics', note: '6-week notice. If client wants faster, manage expectations early.' },
      ],
      watchOuts: ['Long notice period (6 wks) — flag to client up front.'],
      timeline: [
        { d: 'Jun 7', e: 'Sourced — inbound referral from a placed candidate.' },
        { d: 'Jun 9', e: 'First screen — 45 min. Strong on complexity + mentoring.' },
        { d: 'Jun 12', e: 'Second screen — composure + stability confirmed.' },
        { d: 'Jun 13', e: 'Dossier approved by Theo Marsh. Released to client.' },
      ],
    },
  },
  {
    id: 'daniel-okafor',
    name: 'Daniel Okafor', initials: 'DO', fit: 87, stage: 'Client Ready',
    role: 'Senior Tax Accountant', company: 'Halloran & West CPAs', years: 9,
    location: 'Providence, RI', compExp: '$168–175k', avail: '4-week notice',
    tags: ['Multi-state', 'CPA', '9 yrs'],
    approval: 'approved',
    blurb: 'Technically the strongest of the field. Ready to step up into leadership.',
    dossier: {
      headline: 'A multi-state technician ready to make the step up to lead.',
      writeup: {
        intro:
          'Daniel is the strongest pure technician in the field and a deliberate step-up bet that pays off. Nine years at a respected regional firm have made him the person peers route their hardest multi-state and trust returns to. He has trained every junior who has passed through his group, and he is looking for exactly one thing next — a first formal mandate to lead, which is what this seat offers.',
        fit: [
          'Technical depth that anchors a practice — owns the firm’s hardest multi-state and trust work, with review quality colleagues escalate to.',
          'A mentor in everything but title — he has informally trained every junior in his group and is hungry to do it formally for your associates.',
          'The lowest flight risk on the list — nine years at one firm, promoted twice, and motivated by growth rather than escape.',
        ],
        cta:
          'Daniel is the value play — the same technical ceiling as the field’s best, at the bottom of your band, with everything to prove. Bring him in, see the upside in person, and you may close this search below budget.',
      },
      summary:
        'Daniel is the deepest pure technician in the field — nine years of complex multi-state and trust work at a respected regional firm. He has informally mentored juniors and is hungry for a formal leadership mandate, which Meridian offers.',
      highlights: [
        'Specialist in complex multi-state and trust returns; exceptional review quality.',
        'CPA; has informally trained every junior who has joined his group.',
        'Stable — nine years at one firm, promoted twice.',
        'Looking specifically for a first formal people-leadership role.',
      ],
      signals: [
        { signal: 'Owned complexity', score: 'strong',  evidence: 'Owns the firm’s hardest multi-state returns; peers route escalations to him.' },
        { signal: 'Real mentoring',   score: 'solid',   evidence: 'Mentors informally and well, but has never carried a formal team. Upside, not proof.' },
        { signal: 'Stability',        score: 'strong',  evidence: '9 yrs, one firm, two promotions. Lowest flight risk in the field.' },
        { signal: 'Composure',        score: 'partial', evidence: 'Calm one-on-one; client-facing polish under pressure still being validated.' },
      ],
      internalNotes: [
        { tag: 'Risk', note: 'First formal leadership role — there is a step-up bet here. Frame as growth, not gap.' },
        { tag: 'Comp', note: 'Will move for $170k. Cheapest strong option; do not over-negotiate and lose goodwill.' },
      ],
      watchOuts: ['No formal team-lead experience yet — position as a high-upside step up, set client expectations.'],
      timeline: [
        { d: 'Jun 8', e: 'Sourced via Boolean search; strong résumé match.' },
        { d: 'Jun 10', e: 'First screen — technical depth excellent.' },
        { d: 'Jun 13', e: 'Dossier approved by Theo Marsh. Released to client.' },
      ],
    },
  },
  {
    id: 'vincent-cho',
    name: 'Vincent Cho', initials: 'VC', fit: 83, stage: 'Client Ready',
    role: 'Tax Manager', company: 'Aldrich Family Office', years: 10,
    location: 'Boston, MA', compExp: '$175–182k', avail: '8-week notice',
    tags: ['Trust & estate', 'CPA', '10 yrs'],
    approval: 'approved',
    blurb: 'Family-office pedigree. Reads the UHNW room as well as anyone we have seen.',
    dossier: {
      headline: 'Family-office polish — built for the client-facing half of the job.',
      writeup: {
        intro:
          'Vincent comes straight from a single-family office, where reading the room is the entire job — and it shows. His trust-and-estate depth is real, but what sets him apart is the client-facing polish this UHNW-facing seat lives or dies on. After years working solo, he is looking for a firm platform with a team to lead, which is exactly the trajectory Meridian can offer.',
        fit: [
          'Built for the client-facing half of the role — ten years inside a family office means UHNW principals are his native habitat, with the discretion to match.',
          'Genuine technical specialization — deep trust-and-estate expertise and a CPA, squarely on your most sensitive engagements.',
          'Motivated by the platform you’re offering — he wants the team and firm structure he’s never had, so this seat is an upgrade he’ll commit to.',
        ],
        cta:
          'If client experience is the thing you can’t afford to get wrong, Vincent is your meeting. Get him across the table from a principal and you’ll see in ten minutes why we put him forward — let’s schedule it.',
      },
      summary:
        'Vincent comes straight from a single-family office, where client intimacy is the entire job. His trust-and-estate depth is real, and his bedside manner with UHNW principals is the best in the field. The open question is bench-building at scale.',
      highlights: [
        'Ten years inside a family office — UHNW client relationships are his native habitat.',
        'Deep trust & estate specialization; CPA.',
        'Exceptional client-facing presence and discretion.',
        'Seeks a firm platform with a team to lead, after years solo.',
      ],
      signals: [
        { signal: 'Owned complexity', score: 'solid',   evidence: 'Strong trust/estate depth; less multi-state volume than Daniel or Eleanor.' },
        { signal: 'Real mentoring',   score: 'partial', evidence: 'Worked largely solo in the family office — mentoring is aspiration, not track record.' },
        { signal: 'Stability',        score: 'solid',   evidence: '10 yrs, two roles. Stable, no flags.' },
        { signal: 'Composure',        score: 'strong',  evidence: 'Best client-facing instincts in the field. Made for the UHNW room.' },
      ],
      internalNotes: [
        { tag: 'Fit', note: 'The polish play. If the client weights client-facing over team-building, he is the pick.' },
        { tag: 'Logistics', note: '8-week notice is the longest of the three — flag if timeline tightens.' },
      ],
      watchOuts: ['Limited formal mentoring history — probe how he’ll build the associate pod.'],
      timeline: [
        { d: 'Jun 8', e: 'Sourced — known name in the Boston family-office circle.' },
        { d: 'Jun 11', e: 'First screen — client-facing polish stood out immediately.' },
        { d: 'Jun 13', e: 'Dossier approved by Theo Marsh. Released to client.' },
      ],
    },
  },
  {
    id: 'marguerite-bell',
    name: 'Marguerite Bell', initials: 'MB', fit: 80, stage: 'Internal Review',
    role: 'Senior Manager', company: 'Crandall Whitfield (Big Four)', years: 12,
    location: 'Boston, MA', compExp: '$185k+', avail: '4-week notice',
    tags: ['Big Four', 'CPA', '12 yrs'],
    approval: 'pending',
    blurb: 'Big-Four leadership at scale. Awaiting your sign-off before the client sees her.',
    dossier: {
      headline: 'Big-Four leadership at scale — the heaviest résumé in the field.',
      writeup: {
        intro:
          'Marguerite carries the heaviest résumé in the field — she leads a team of eight at a Big-Four firm and wants out of the grind into a place where she can practice tax, not just run process. The leadership and complexity are beyond question; the one thing worth testing in person is whether the smaller, higher-touch culture you’re building is the change she is genuinely after.',
        fit: [
          'Leadership at scale — she runs a team of eight today, the most proven people-leader of anyone we’ve screened.',
          'Nothing here would stretch her — a Big-Four complexity ceiling means your hardest engagements are routine.',
          'Deliberately downshifting — she’s seeking the smaller, client-first platform Meridian is, not another process machine.',
        ],
        cta:
          'Marguerite is the high-ceiling option — meet her, press hard on culture fit, and if the chemistry is right you’ll have hired above the brief. Worth an hour of your week.',
      },
      summary:
        'Marguerite manages a team of eight at a Big-Four firm and wants out of the grind into a place where she can practice tax, not just run process. The leadership and complexity are unquestionable; the open question is whether the intensity she’s leaving is the intensity she’d bring.',
      highlights: [
        'Leads a team of eight; deep UHNW and complex-entity experience.',
        'CPA; twelve years, steady progression to Senior Manager.',
        'Wants a smaller, higher-touch platform — Meridian fits the brief.',
      ],
      signals: [
        { signal: 'Owned complexity', score: 'strong',  evidence: 'Big-Four complexity ceiling; nothing in this role would stretch her technically.' },
        { signal: 'Real mentoring',   score: 'strong',  evidence: 'Runs a team of eight today; most proven people-leader in the field.' },
        { signal: 'Stability',        score: 'solid',   evidence: '12 yrs, one firm. Stable — but leaving Big-Four; probe the "why now".' },
        { signal: 'Composure',        score: 'partial', evidence: 'Composed, but comes from exactly the burnout culture the client is fleeing. Must screen the fit, not just the skill.' },
      ],
      internalNotes: [
        { tag: 'Risk', note: 'The client’s scar tissue is burnout. She is excellent but radiates Big-Four intensity. Recommend release, but client should screen culture-fit hard.' },
        { tag: 'Comp', note: 'Will need the top of band ($185k). No room below.' },
      ],
      watchOuts: ['Comes from the intense culture the client is fleeing — culture-fit is the whole risk.'],
      timeline: [
        { d: 'Jun 9', e: 'Sourced via Boolean; flagged as a stretch-up on profile.' },
        { d: 'Jun 12', e: 'First screen — leadership + complexity confirmed.' },
        { d: 'Jun 13', e: 'Submitted for internal review — awaiting manager sign-off.' },
      ],
    },
  },
  {
    id: 'sara-whitman',
    name: 'Sara Whitman', initials: 'SW', fit: 72, stage: 'Qualified',
    role: 'Tax Specialist', company: 'Linden & Cole', years: 7,
    location: 'Worcester, MA', compExp: '$150–160k', avail: '2-week notice',
    tags: ['Trust tax', '7 yrs'],
    approval: null,
    blurb: 'Good technically — but two short stints have her flagged hard on stability.',
    dossier: {
      headline: 'Capable on paper — but the stability flag is the whole story.',
      summary:
        'Sara is technically solid in trust tax, but two sub-two-year stints in the last four years trip exactly the wire the client cannot afford to trip again. Kept warm, not advanced.',
      highlights: [
        'Solid trust-tax fundamentals; would clear most clients’ technical bar.',
        'Available quickly — two-week notice.',
      ],
      signals: [
        { signal: 'Owned complexity', score: 'solid',   evidence: 'Competent trust work; not at the UHNW-volume ceiling of the top three.' },
        { signal: 'Real mentoring',   score: 'gap',     evidence: 'No mentoring track record surfaced.' },
        { signal: 'Stability',        score: 'gap',     evidence: 'Two stints under 2 yrs in 4 yrs. This is the exact pattern the client got burned on twice.' },
        { signal: 'Composure',        score: 'partial', evidence: 'Reads fine, but not screened deeply — held before investing more.' },
      ],
      internalNotes: [
        { tag: 'Hold', note: 'Do not advance unless the top of the field falls through. The stability story would re-open the client’s wound.' },
      ],
      watchOuts: ['Two short stints — fails the client’s single hardest filter.'],
      timeline: [
        { d: 'Jun 9', e: 'Sourced; résumé looked strong on first pass.' },
        { d: 'Jun 11', e: 'Screen — stability flag surfaced. Held in pipeline.' },
      ],
    },
  },
];
