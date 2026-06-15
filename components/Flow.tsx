'use client';
/* ============================================================
   Spyglass Matrix — the connected flow
   builder → building → matrix → submitting → client
   ============================================================ */
import React from 'react';
import { Button } from './ui';
import { Arrow, LockIcon } from './icons';
import { BuilderStage } from './BuilderStage';
import { BuildOverlay, SubmitOverlay } from './Overlays';
import { MatrixView } from './MatrixView';
import { ClientApp } from './Client';
import { FlowContext, type FlowCtx } from './FlowContext';
import { CANDS, MATRIX } from '@/lib/data';
import type { BuilderPayload, ClientView, Decision, Feedback, Matrix } from '@/lib/types';

type Stage = 'builder' | 'building' | 'matrix' | 'submitting' | 'client';

export function Flow() {
  const [stage, setStage] = React.useState<Stage>('builder');
  const [genMatrix, setGenMatrix] = React.useState<Matrix | null>(null);

  // Client-portal shared state
  const [approvals, setApprovals] = React.useState<Record<string, 'approved' | 'pending'>>(
    () => Object.fromEntries(CANDS.filter((c) => c.approval).map((c) => [c.id, c.approval as 'approved' | 'pending'])),
  );
  const [feedback, setFeedback] = React.useState<Record<string, Feedback>>({});
  const [placed, setPlaced] = React.useState<string | null>(null);
  const [clientView, setClientView] = React.useState<ClientView>({ name: 'portal', candId: null });

  const build = async (payload: BuilderPayload) => {
    setStage('building');
    const minWait = new Promise((r) => setTimeout(r, 2000));
    let result: Matrix | null = null;
    try {
      const res = await fetch('/api/generate-matrix', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      result = (data?.matrix as Matrix) || null;
    } catch {
      result = null;
    }
    await minWait;
    setGenMatrix(result || MATRIX);
    setStage('matrix');
    window.scrollTo({ top: 0, behavior: 'auto' });
  };

  const submit = () => {
    setStage('submitting');
    setTimeout(() => { setStage('client'); window.scrollTo({ top: 0, behavior: 'auto' }); }, 1980);
  };

  const ctx: FlowCtx = {
    approvals,
    feedback,
    giveFeedback: (id, decision: Decision, note) => setFeedback((f) => ({ ...f, [id]: { decision, note } })),
    placed,
    place: (id) => setPlaced(id),
    clientView,
    setClientView,
  };

  return (
    <div className={'stage-shell' + (stage === 'client' ? ' client' : '')}>
      {stage === 'builder' && <BuilderStage onBuild={build} />}
      {stage === 'building' && <BuildOverlay />}
      {stage === 'matrix' && genMatrix && (
        <MatrixStage matrix={genMatrix} onSubmit={submit} onBack={() => { setStage('builder'); window.scrollTo({ top: 0, behavior: 'auto' }); }} />
      )}
      {stage === 'submitting' && <SubmitOverlay />}
      {stage === 'client' && (
        <FlowContext.Provider value={ctx}>
          <div style={{ paddingTop: 8 }}><ClientApp /></div>
        </FlowContext.Provider>
      )}
    </div>
  );
}

function MatrixStage({ matrix, onSubmit, onBack }: { matrix: Matrix; onSubmit: () => void; onBack: () => void }) {
  return (
    <div className="frame-pad">
      <button onClick={onBack} className="print-hide" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3)', fontFamily: "'Geist Mono', monospace", fontSize: 12, letterSpacing: '0.05em', textTransform: 'uppercase', padding: 0, marginBottom: 20 }}>
        ← New engagement
      </button>
      <MatrixView matrix={matrix} />
      <div className="submitbar print-hide">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span className="sb-ic"><LockIcon c="var(--navy)" /></span>
          <div>
            <div className="sb-t">Candidate-safe shortlist ready to send</div>
            <div className="sb-d">Internal strategy sealed · candidate-safe dossiers packaged for Meridian Wealth Advisors</div>
          </div>
        </div>
        <Button kind="primary" icon={<Arrow />} onClick={onSubmit}>Submit to client</Button>
      </div>
    </div>
  );
}
