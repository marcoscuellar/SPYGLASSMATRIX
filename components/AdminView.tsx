'use client';
/* ============================================================
   Spyglass Matrix — recruiter admin
   Add candidates to the client portal by hand, review what's in
   there, and remove anyone. Everything here writes to the store.
   ============================================================ */
import React from 'react';
import { Button, FitChip, Mark, Tag } from './ui';
import { Arrow } from './icons';
import type { ScoreKey, StoredCandidate } from '@/lib/types';

const SCORES: ScoreKey[] = ['strong', 'solid', 'partial', 'gap'];
const PORTAL_PATH = '/portal';

type SignalRow = { signal: string; score: ScoreKey };

const emptyForm = () => ({
  name: '', role: '', company: '', years: '', location: '', compExp: '', avail: '',
  tags: '', fit: '', headline: '', intro: '', fitBullets: '', cta: '',
  signals: [
    { signal: '', score: 'solid' as ScoreKey },
    { signal: '', score: 'solid' as ScoreKey },
    { signal: '', score: 'solid' as ScoreKey },
    { signal: '', score: 'solid' as ScoreKey },
  ] as SignalRow[],
});

export function AdminView({ initial, persistent }: { initial: StoredCandidate[]; persistent: boolean }) {
  const [list, setList] = React.useState<StoredCandidate[]>(initial);
  const [f, setF] = React.useState(emptyForm());
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');
  const set = (k: string, v: any) => setF((s) => ({ ...s, [k]: v }));
  const setSig = (i: number, k: 'signal' | 'score', v: string) =>
    setF((s) => ({ ...s, signals: s.signals.map((r, j) => (j === i ? { ...r, [k]: v } : r)) }));

  const portalUrl = typeof window !== 'undefined' ? window.location.origin + PORTAL_PATH : PORTAL_PATH;

  const add = async () => {
    if (!f.name.trim()) { setError('Name is required.'); return; }
    setSaving(true); setError('');
    try {
      const res = await fetch('/api/candidates', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          ...f,
          fitBullets: f.fitBullets.split('\n').map((s) => s.trim()).filter(Boolean),
          signals: f.signals.filter((s) => s.signal.trim()),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Could not save.');
      setList((l) => [...l, data.candidate]);
      setF(emptyForm());
    } catch (e: any) {
      setError(e.message || 'Could not save.');
    }
    setSaving(false);
  };

  const remove = async (id: string) => {
    setList((l) => l.filter((c) => c.id !== id));
    await fetch(`/api/candidates/${id}`, { method: 'DELETE' });
  };

  const labelStyle: React.CSSProperties = { fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-3)', display: 'block', marginBottom: 7 };
  const inputStyle: React.CSSProperties = { width: '100%', boxSizing: 'border-box', border: '1px solid var(--line)', borderRadius: 'var(--r-3)', padding: '10px 13px', fontFamily: 'var(--font)', fontSize: 15, color: 'var(--ink)', background: 'var(--paper)' };
  const taStyle: React.CSSProperties = { ...inputStyle, borderRadius: 'var(--r-4)', lineHeight: 1.5, resize: 'vertical' };
  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div><label style={labelStyle}>{label}</label>{children}</div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--paper)', padding: '30px 0 80px' }}>
      <div style={{ maxWidth: 920, margin: '0 auto', padding: '0 24px' }}>
        {/* Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, paddingBottom: 20, borderBottom: '1px solid var(--line)', marginBottom: 24, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
            <Mark variant="primary" size={26} />
            <span style={{ fontWeight: 900, fontSize: 16, letterSpacing: '-0.06em' }}>SPYGLASS&nbsp;MATRIX</span>
            <span style={{ fontSize: 14, color: 'var(--ink-3)', fontWeight: 500, borderLeft: '1px solid var(--line)', paddingLeft: 12 }}>Portal admin</span>
          </div>
          <a href={PORTAL_PATH} target="_blank" rel="noreferrer" className="t-mono-xs" style={{ color: 'var(--navy)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            OPEN CLIENT PORTAL <Arrow s={12} />
          </a>
        </div>

        {!persistent && (
          <div style={{ marginBottom: 22, padding: '14px 16px', borderRadius: 'var(--r-4)', border: '1px solid var(--gold-line)', background: 'var(--amber-bg)', fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.5 }}>
            <b style={{ color: 'var(--ink)' }}>Heads up — no database connected yet.</b> Candidates you add won’t reliably show up for your client on another device until Postgres is provisioned. Add it in Vercel → Storage (one click), then redeploy.
          </div>
        )}

        {/* Share link */}
        <div style={{ marginBottom: 28, padding: '16px 18px', borderRadius: 'var(--r-5)', border: '1px solid var(--line)', background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
          <div>
            <div className="t-mono-xs" style={{ color: 'var(--ink-3)', marginBottom: 5 }}>SEND THIS TO YOUR CLIENT</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 14, color: 'var(--navy)' }}>{portalUrl}</div>
          </div>
          <Button kind="secondary" onClick={() => navigator.clipboard?.writeText(portalUrl)}>Copy link</Button>
        </div>

        {/* Add form */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--line)', borderRadius: 'var(--r-7)', boxShadow: 'var(--sh-card)', padding: '26px 28px', marginBottom: 32 }}>
          <h2 style={{ fontFamily: 'var(--font)', fontWeight: 700, fontSize: 22, letterSpacing: '-0.02em', margin: '0 0 18px' }}>Add a candidate</h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <Field label="Name *"><input style={inputStyle} value={f.name} onChange={(e) => set('name', e.target.value)} placeholder="Eleanor Pace" /></Field>
            <Field label="Current title"><input style={inputStyle} value={f.role} onChange={(e) => set('role', e.target.value)} placeholder="Tax Manager" /></Field>
            <Field label="Company"><input style={inputStyle} value={f.company} onChange={(e) => set('company', e.target.value)} placeholder="Beacon Private Wealth" /></Field>
            <Field label="Years experience"><input style={inputStyle} value={f.years} onChange={(e) => set('years', e.target.value)} placeholder="11" /></Field>
            <Field label="Location"><input style={inputStyle} value={f.location} onChange={(e) => set('location', e.target.value)} placeholder="Boston, MA" /></Field>
            <Field label="Fit score (0–100)"><input style={inputStyle} value={f.fit} onChange={(e) => set('fit', e.target.value)} placeholder="91" /></Field>
            <Field label="Comp expectation"><input style={inputStyle} value={f.compExp} onChange={(e) => set('compExp', e.target.value)} placeholder="$178–185k" /></Field>
            <Field label="Availability"><input style={inputStyle} value={f.avail} onChange={(e) => set('avail', e.target.value)} placeholder="6-week notice" /></Field>
          </div>

          <div style={{ marginBottom: 14 }}>
            <Field label="Tags (comma-separated)"><input style={inputStyle} value={f.tags} onChange={(e) => set('tags', e.target.value)} placeholder="UHNW, CPA · MST, 11 yrs" /></Field>
          </div>
          <div style={{ marginBottom: 14 }}>
            <Field label="Headline"><input style={inputStyle} value={f.headline} onChange={(e) => set('headline', e.target.value)} placeholder="A private-client tax lead who already runs the room." /></Field>
          </div>
          <div style={{ marginBottom: 14 }}>
            <Field label="Brief — opening paragraph"><textarea style={{ ...taStyle, minHeight: 90 }} value={f.intro} onChange={(e) => set('intro', e.target.value)} placeholder="Why this candidate, in a few sentences the client will read first." /></Field>
          </div>
          <div style={{ marginBottom: 14 }}>
            <Field label="Why they fit the brief (one per line)"><textarea style={{ ...taStyle, minHeight: 80 }} value={f.fitBullets} onChange={(e) => set('fitBullets', e.target.value)} placeholder={'Owns complexity you can’t teach…\nAlready a bench-builder…\nSteady where it counts…'} /></Field>
          </div>
          <div style={{ marginBottom: 18 }}>
            <Field label="Closing line / call to action"><input style={inputStyle} value={f.cta} onChange={(e) => set('cta', e.target.value)} placeholder="If you see one candidate this week, make it Eleanor." /></Field>
          </div>

          <label style={labelStyle}>Signal map (how they map to the brief)</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
            {f.signals.map((s, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 130px', gap: 10 }}>
                <input style={inputStyle} value={s.signal} onChange={(e) => setSig(i, 'signal', e.target.value)} placeholder={`Signal ${i + 1} (e.g. Owned complexity)`} />
                <select style={{ ...inputStyle, cursor: 'pointer' }} value={s.score} onChange={(e) => setSig(i, 'score', e.target.value)}>
                  {SCORES.map((sc) => <option key={sc} value={sc}>{sc[0].toUpperCase() + sc.slice(1)}</option>)}
                </select>
              </div>
            ))}
          </div>

          {error && <div style={{ color: '#b42318', fontSize: 14, marginBottom: 12 }}>{error}</div>}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button kind="amber" icon={<Arrow />} onClick={add} disabled={saving}>{saving ? 'Adding…' : 'Add to portal'}</Button>
          </div>
        </div>

        {/* Current list */}
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
          <h2 className="t-mono-tag" style={{ color: 'var(--ink-2)' }}>IN THE PORTAL</h2>
          <span className="t-mono-xs" style={{ color: 'var(--ink-3)' }}>{list.length} CANDIDATE{list.length === 1 ? '' : 'S'}</span>
        </div>
        {list.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', border: '1px dashed var(--line)', borderRadius: 'var(--r-5)', color: 'var(--ink-3)', fontSize: 15 }}>
            No candidates yet. Add one above and it appears in the client portal instantly.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {list.map((c) => (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', background: 'var(--bg-card)', border: '1px solid var(--line)', borderRadius: 'var(--r-5)' }}>
                <FitChip fit={c.fit} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--font)', fontWeight: 700, fontSize: 17, letterSpacing: '-0.02em' }}>{c.name}</div>
                  <div className="t-body" style={{ color: 'var(--ink-3)', fontSize: 14 }}>{[c.role, c.company].filter(Boolean).join(' · ')}</div>
                </div>
                {c.decision && <Tag tone={c.decision === 'advance' ? 'live' : c.decision === 'hold' ? 'amber' : 'pipeline'}>{c.decision === 'advance' ? 'Client advanced' : c.decision === 'hold' ? 'Client holding' : 'Client passed'}</Tag>}
                <button onClick={() => remove(c.id)} className="t-mono-xs" style={{ background: 'none', border: '1px solid var(--line)', borderRadius: 'var(--r-2)', padding: '7px 11px', color: 'var(--ink-3)', cursor: 'pointer' }}>Remove</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
