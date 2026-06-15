'use client';
/* ============================================================
   Spyglass Matrix — stepped progress overlays
   The "building the Matrix" and "submitting to client" bridges.
   ============================================================ */
import React from 'react';
import { Mark } from './ui';
import { CheckIcon } from './icons';

function FlowSpin() {
  return <div style={{ animation: 'spgSpin 1.1s linear infinite', width: 40, height: 40 }}><Mark variant="amber" size={40} /></div>;
}

function SteppedOverlay({ title, steps, interval }: { title: string; steps: string[]; interval: number }) {
  const [s, setS] = React.useState(0);
  React.useEffect(() => {
    const t = setInterval(() => setS((v) => Math.min(v + 1, steps.length - 1)), interval);
    return () => clearInterval(t);
  }, [steps.length, interval]);
  return (
    <div className="submitstage">
      <div style={{ textAlign: 'center', maxWidth: 480 }}>
        <div style={{ display: 'inline-flex', marginBottom: 24 }}><FlowSpin /></div>
        <div style={{ fontFamily: "'Geist', sans-serif", fontWeight: 700, fontSize: 24, letterSpacing: '-0.03em', marginBottom: 20 }}>{title}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 11, textAlign: 'left' }}>
          {steps.map((t, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, opacity: i <= s ? 1 : 0.32, transition: 'opacity .3s' }}>
              <span style={{ width: 18, height: 18, borderRadius: 99, display: 'grid', placeItems: 'center', background: i < s ? 'var(--navy)' : 'transparent', border: i < s ? 'none' : '1.5px solid var(--ink-4)', flexShrink: 0 }}>
                {i < s && <CheckIcon c="#fff" s={11} />}
              </span>
              <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: 13.5, color: 'var(--ink-2)', letterSpacing: '0.01em' }}>{t}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function BuildOverlay() {
  return (
    <SteppedOverlay
      title="Building the Matrix"
      interval={450}
      steps={[
        'Reading the job description…',
        'Parsing your meeting notes…',
        'Extracting the soft-skill signals…',
        'Writing role-specific screening questions…',
        'Forking recruiter + candidate copies…',
      ]}
    />
  );
}

export function SubmitOverlay() {
  return (
    <SteppedOverlay
      title="Submitting to the client"
      interval={430}
      steps={[
        'Sealing internal strategy notes…',
        'Packaging candidate-safe dossiers…',
        'Encrypting the shortlist…',
        'Sending to Meridian Wealth Advisors…',
      ]}
    />
  );
}
