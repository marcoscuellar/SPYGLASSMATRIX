'use client';
/* ============================================================
   Spyglass Matrix — client-portal flow context
   Shared state for the client-facing surfaces: which candidates
   are approved/shortlisted, the client's feedback, the placement,
   and the active client sub-view.
   ============================================================ */
import React from 'react';
import type { ClientView, Decision, Feedback } from '@/lib/types';

export type FlowCtx = {
  approvals: Record<string, 'approved' | 'pending'>;
  feedback: Record<string, Feedback>;
  giveFeedback: (id: string, decision: Decision, note: string) => void;
  placed: string | null;
  place: (id: string) => void;
  clientView: ClientView;
  setClientView: (v: ClientView) => void;
};

export const FlowContext = React.createContext<FlowCtx | null>(null);

export function useFlow(): FlowCtx {
  const ctx = React.useContext(FlowContext);
  if (!ctx) throw new Error('useFlow must be used within FlowContext.Provider');
  return ctx;
}
