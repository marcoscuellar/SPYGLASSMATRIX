/* ============================================================
   Spyglass Matrix — inline SVG icons (no external assets)
   ============================================================ */
import React from 'react';

type IconProps = { c?: string; s?: number };

export const Arrow = ({ s = 14 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
);

export const SendIcon = ({ c = 'currentColor', s = 14 }: IconProps) => (
  <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><path d="M14.5 1.5L7.3 8.7M14.5 1.5l-4.6 13-2.6-5.8L1.5 6.1l13-4.6z" stroke={c} strokeWidth="1.3" strokeLinejoin="round" strokeLinecap="round" /></svg>
);

export const UploadIcon = ({ c = 'currentColor', s = 13 }: IconProps) => (
  <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><path d="M8 11V3M5 6l3-3 3 3M3 13h10" stroke={c} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
);

export const MicIcon = ({ c = 'currentColor', s = 13 }: IconProps) => (
  <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><rect x="6" y="2" width="4" height="7" rx="2" stroke={c} strokeWidth="1.3" /><path d="M4 8a4 4 0 008 0M8 12v2.5" stroke={c} strokeWidth="1.3" strokeLinecap="round" /></svg>
);

export const FileGlyph = ({ c = 'var(--navy)', s = 14 }: IconProps) => (
  <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><path d="M4 1.6h5L13 5.5V13.9a.5.5 0 01-.5.5h-9A.5.5 0 013 13.9V2.1a.5.5 0 01.5-.5z" stroke={c} strokeWidth="1.3" strokeLinejoin="round" /><path d="M9 1.6V5.6h4" stroke={c} strokeWidth="1.3" strokeLinejoin="round" /></svg>
);

export const LockIcon = ({ c = 'var(--navy-fade)', s = 14 }: IconProps) => (
  <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><rect x="3" y="7" width="10" height="7" rx="1.5" stroke={c} strokeWidth="1.4" /><path d="M5 7V5a3 3 0 016 0v2" stroke={c} strokeWidth="1.4" /></svg>
);

export const CheckIcon = ({ c = 'var(--navy)', s = 15 }: IconProps) => (
  <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><path d="M3 8.5l3.5 3.5L13 4.5" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
);

export const PrinterIcon = ({ c = 'currentColor' }: IconProps) => (
  <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M4 6V2h8v4M4 12H3a1 1 0 01-1-1V8a1 1 0 011-1h10a1 1 0 011 1v3a1 1 0 01-1 1h-1M4 10h8v4H4z" stroke={c} strokeWidth="1.3" strokeLinejoin="round" strokeLinecap="round" /></svg>
);

export const EyeIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M1 8s2.5-4.5 7-4.5S15 8 15 8s-2.5 4.5-7 4.5S1 8 1 8z" stroke="currentColor" strokeWidth="1.3" /><circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.3" /></svg>
);

export const FlagIcon = ({ c = 'var(--amber)' }: IconProps) => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M4 14V2M4 3h8l-2 3 2 3H4" stroke={c} strokeWidth="1.4" strokeLinejoin="round" strokeLinecap="round" /></svg>
);

export const SparkIcon = ({ c = 'var(--navy)', s = 16 }: IconProps) => (
  <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><path d="M8 1l1.4 4.0L13.5 6.5 9.4 7.9 8 12 6.6 7.9 2.5 6.5 6.6 5.1 8 1z" fill={c} /><path d="M13 10.2l.5 1.5 1.5.5-1.5.5-.5 1.5-.5-1.5-1.5-.5 1.5-.5.5-1.5z" fill={c} opacity="0.55" /></svg>
);
