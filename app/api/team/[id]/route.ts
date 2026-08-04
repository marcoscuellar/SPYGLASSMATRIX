import { NextResponse } from 'next/server';
import { deleteUser } from '@/lib/store';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const s = getSession();
  if (!s || s.role !== 'admin') return NextResponse.json({ error: 'Admins only.' }, { status: 403 });
  if (params.id === s.uid) return NextResponse.json({ error: 'You can’t remove your own account.' }, { status: 400 });
  await deleteUser(params.id);
  return NextResponse.json({ ok: true });
}
