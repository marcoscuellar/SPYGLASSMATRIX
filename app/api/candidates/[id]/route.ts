import { NextRequest, NextResponse } from 'next/server';
import { deleteCandidate, getCandidate } from '@/lib/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const candidate = await getCandidate(params.id);
  if (!candidate) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ candidate });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await deleteCandidate(params.id);
  return NextResponse.json({ ok: true });
}
