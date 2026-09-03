import { NextRequest, NextResponse } from 'next/server';
import { deleteCandidate, getCandidate, updateCandidate } from '@/lib/store';
import { getSession } from '@/lib/auth';
import { parseCandidateInput } from '@/lib/candidate-input';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const candidate = await getCandidate(params.id);
  if (!candidate) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ candidate });
}

// Editing the client-facing copy. Login only — the portal itself stays public.
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  if (!getSession()) return NextResponse.json({ error: 'Not authorised.' }, { status: 401 });
  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }); }
  const input = parseCandidateInput(body);
  if (!input.name) return NextResponse.json({ error: 'Name is required.' }, { status: 422 });
  const candidate = await updateCandidate(params.id, input);
  if (!candidate) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ candidate });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  if (!getSession()) return NextResponse.json({ error: 'Not authorised.' }, { status: 401 });
  await deleteCandidate(params.id);
  return NextResponse.json({ ok: true });
}
