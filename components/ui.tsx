'use client';
/* ============================================================
   Spyglass Matrix — shared UI primitives
   Mark (the cufflink), Wordmark, Eyebrow, Tag, Dot, Button,
   MonoButton, Card, Avatar, FitChip. Built on the design tokens.
   ============================================================ */
import React from 'react';

// ---- The mark: the cufflink housing, recolored per-variant ----
type MarkVariant = 'primary' | 'amber' | 'navy' | 'forest' | 'light';

export function Mark({ variant = 'primary', size = 28 }: { variant?: MarkVariant; size?: number }) {
  const V: Record<MarkVariant, any> = {
    primary: { housing: '#0A1F3D', band: '#ffffff', stitch: '#0A1F3D', cuf: ['#C2A24C', '#0A1F3D', '#C2A24C'] },
    amber:   { housing: '#0a0a0a', band: '#ffffff', stitch: '#0a0a0a', cuf: ['#C2A24C', '#ffffff', '#C2A24C'] },
    navy:    { housing: '#0A1F3D', band: '#ffffff', stitch: '#0A1F3D', cuf: ['#C2A24C', '#0A1F3D', '#C2A24C'] },
    forest:  { housing: '#C2A24C', band: '#ffffff', stitch: '#C2A24C', cuf: ['#0A1F3D', '#ffffff', '#0A1F3D'] },
    light:   { housing: '#f5f5f4', housingStroke: '#e7e5e4', band: '#0a0a0a', stitch: '#ffffff', stitchOpacity: 0.55, cuf: ['#ffffff', '#0a0a0a', '#ffffff'] },
  };
  const v = V[variant] || V.primary;
  const stitchVisible = size > 20;
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width={size} height={size} role="img" aria-label="Spyglass">
      <rect width="100" height="100" rx="28" fill={v.housing} stroke={v.housingStroke || 'none'} strokeWidth={v.housingStroke ? 1 : 0} />
      <rect x="14" y="38" width="72" height="24" rx="3" fill={v.band} />
      {stitchVisible && (
        <line x1="20" y1="50" x2="62" y2="50" stroke={v.stitch} strokeWidth="1.4" strokeDasharray="3 3" opacity={v.stitchOpacity ?? 1} />
      )}
      <circle cx="72" cy="50" r="9" fill={v.cuf[0]} />
      <circle cx="72" cy="50" r="5" fill={v.cuf[1]} />
      <circle cx="72" cy="50" r="2" fill={v.cuf[2]} />
    </svg>
  );
}

export function Wordmark({ size = 20, color = 'var(--ink)' }: { size?: number; color?: string }) {
  return (
    <span style={{ fontFamily: "'Geist', sans-serif", fontWeight: 900, fontSize: size, letterSpacing: '-0.07em', lineHeight: 1, color, whiteSpace: 'nowrap' }} aria-label="SPYGLASS">
      SPYGLASS
    </span>
  );
}

export function Eyebrow({ children, color = 'var(--ink-3)', style }: { children: React.ReactNode; color?: string; style?: React.CSSProperties }) {
  return (
    <span className="t-mono-tag" style={{ color, display: 'inline-flex', alignItems: 'center', gap: 8, ...style }}>
      {children}
    </span>
  );
}

type TagTone = 'pipeline' | 'ink' | 'amber' | 'navy' | 'live' | 'forest';

export function Tag({ children, tone = 'pipeline' }: { children: React.ReactNode; tone?: TagTone }) {
  const tones: Record<TagTone, React.CSSProperties> = {
    pipeline: { background: 'var(--paper)', color: 'var(--ink-2)', border: '1px solid var(--line)' },
    ink:      { background: 'var(--ink)', color: '#fff', border: '1px solid var(--ink)' },
    amber:    { background: 'var(--amber-bg)', color: 'var(--amber-dd)', border: '1px solid var(--gold-line)' },
    navy:     { background: 'rgba(10,31,61,0.06)', color: 'var(--navy)', border: '1px solid rgba(10,31,61,0.16)' },
    live:     { background: 'rgba(10,31,61,0.06)', color: 'var(--navy)', border: '1px solid rgba(10,31,61,0.2)' },
    forest:   { background: 'rgba(10,31,61,0.06)', color: 'var(--navy)', border: '1px solid rgba(10,31,61,0.2)' },
  };
  return (
    <span className="t-mono-xs" style={{ padding: '4px 8px', borderRadius: 'var(--r-1)', whiteSpace: 'nowrap', ...tones[tone] }}>
      {children}
    </span>
  );
}

export function Dot({ color = 'var(--green)' }: { color?: string }) {
  return <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: 99, background: color, boxShadow: `0 0 0 3px rgba(194,162,76,0.18)` }} />;
}

type ButtonKind = 'primary' | 'secondary' | 'amber' | 'navy' | 'ghost';

export function Button({
  children, onClick, kind = 'primary', icon, style, disabled,
}: {
  children: React.ReactNode; onClick?: () => void; kind?: ButtonKind;
  icon?: React.ReactNode; style?: React.CSSProperties; disabled?: boolean;
}) {
  const [hover, setHover] = React.useState(false);
  const base: React.CSSProperties = {
    fontFamily: "'Geist', sans-serif", fontWeight: 600, fontSize: 15.5, letterSpacing: '-0.01em',
    padding: '11px 18px', borderRadius: 'var(--r-3)', cursor: disabled ? 'not-allowed' : 'pointer',
    display: 'inline-flex', alignItems: 'center', gap: 9, transition: 'all .22s var(--ease)',
    border: '1px solid transparent', opacity: disabled ? 0.4 : 1, userSelect: 'none',
  };
  const kinds: Record<ButtonKind, React.CSSProperties> = {
    primary:   { background: 'var(--navy)', color: '#fff', borderColor: 'var(--navy)' },
    secondary: { background: 'transparent', color: 'var(--ink)', borderColor: 'var(--line)' },
    amber:     { background: 'var(--amber)', color: '#2a2008', borderColor: 'var(--amber)' },
    navy:      { background: 'var(--navy)', color: '#fff', borderColor: 'var(--navy)' },
    ghost:     { background: 'transparent', color: 'var(--ink-2)', borderColor: 'transparent' },
  };
  const hoverStyle: React.CSSProperties = !disabled && hover ? (
    kind === 'secondary' ? { borderColor: 'var(--ink)', transform: 'translateY(-2px)' }
    : kind === 'ghost' ? { color: 'var(--ink)', background: 'var(--paper)' }
    : { transform: 'translateY(-2px)', boxShadow: 'var(--sh-hover)' }
  ) : {};
  return (
    <button onClick={disabled ? undefined : onClick} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ ...base, ...kinds[kind], ...hoverStyle, ...style }}>
      {children}
      {icon && <span style={{ transition: 'transform .22s var(--ease)', transform: hover && !disabled ? 'translateX(3px)' : 'none', display: 'inline-flex' }}>{icon}</span>}
    </button>
  );
}

export function MonoButton({ children, onClick, active, style }: { children: React.ReactNode; onClick?: () => void; active?: boolean; style?: React.CSSProperties }) {
  const [hover, setHover] = React.useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} className="t-mono-btn"
      style={{
        padding: '8px 13px', borderRadius: 'var(--r-2)', cursor: 'pointer',
        background: active ? 'var(--ink)' : (hover ? 'var(--paper)' : 'transparent'),
        color: active ? '#fff' : 'var(--ink-2)',
        border: `1px solid ${active ? 'var(--ink)' : 'var(--line)'}`,
        transition: 'all .18s var(--ease)', display: 'inline-flex', alignItems: 'center', gap: 7, ...style,
      }}>
      {children}
    </button>
  );
}

export function Card({
  children, style, onClick, hover: enableHover, tone,
}: {
  children: React.ReactNode; style?: React.CSSProperties; onClick?: () => void;
  hover?: boolean; tone?: 'amber' | 'navy';
}) {
  const [hover, setHover] = React.useState(false);
  const toneBorder = tone === 'amber' ? '2px solid var(--amber)' : tone === 'navy' ? '2px solid var(--navy)' : '1px solid var(--line)';
  return (
    <div onClick={onClick} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        background: 'var(--bg-card)', border: toneBorder, borderRadius: 'var(--r-6)',
        boxShadow: enableHover && hover ? 'var(--sh-hover)' : 'var(--sh-card)',
        transform: enableHover && hover ? 'translateY(-2px)' : 'none',
        transition: 'all .25s var(--ease)', cursor: onClick ? 'pointer' : 'default', ...style,
      }}>
      {children}
    </div>
  );
}

export function Avatar({ initials, accent = 'var(--ink)', size = 34 }: { initials: string; accent?: string; size?: number }) {
  return (
    <div style={{ width: size, height: size, borderRadius: 99, background: accent, color: '#fff', display: 'grid', placeItems: 'center', fontFamily: "'Geist', sans-serif", fontWeight: 600, fontSize: size * 0.38, flexShrink: 0 }}>{initials}</div>
  );
}

export function FitChip({ fit, size = 'sm' }: { fit: number | null; size?: 'sm' | 'lg' }) {
  if (fit == null) {
    return <span className="t-mono-xs" style={{ color: 'var(--ink-4)', border: '1px solid var(--line)', borderRadius: 99, padding: size === 'sm' ? '3px 8px' : '4px 10px', whiteSpace: 'nowrap' }}>NO FIT YET</span>;
  }
  const tier = fit >= 85
    ? { c: '#15795a', bg: 'rgba(21,121,90,0.09)', bd: 'rgba(21,121,90,0.30)' }
    : fit >= 70
      ? { c: '#9a6a12', bg: 'rgba(154,106,18,0.09)', bd: 'rgba(154,106,18,0.28)' }
      : { c: '#9c4a25', bg: 'rgba(156,74,37,0.08)', bd: 'rgba(156,74,37,0.26)' };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 2, padding: size === 'sm' ? '3px 8px' : '4px 10px', borderRadius: 99, background: tier.bg, border: `1px solid ${tier.bd}` }}>
      <span style={{ fontFamily: "'Geist', sans-serif", fontWeight: 800, fontSize: size === 'sm' ? 14.5 : 16.5, color: tier.c, letterSpacing: '-0.02em' }}>{fit}</span>
      <span className="t-mono-xs" style={{ color: tier.c, fontSize: 10 }}>FIT</span>
    </span>
  );
}
