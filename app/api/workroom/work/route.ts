import { NextResponse } from 'next/server';
import { hasAccess } from '@/lib/access';
import { saveMatrixWork } from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function PUT(req: Request) {
  // The workroom holds internal strategy, so the write path is gated too —
  // not just the page that renders it.
  if (!hasAccess()) return NextResponse.json({ error: 'Locked.' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const id = String((body as any)?.id || '');
  if (!id) return NextResponse.json({ error: 'Missing matrix id.' }, { status: 400 });

  // Coerce to the stored shape; never trust the client's object wholesale.
  const rawNotes = (body as any)?.notes || {};
  const rawGrades = (body as any)?.grades || {};
  const notes: Record<string, string> = {};
  const grades: Record<string, number> = {};
  for (const k of Object.keys(rawNotes).slice(0, 200)) notes[String(k)] = String(rawNotes[k] ?? '').slice(0, 20000);
  for (const k of Object.keys(rawGrades).slice(0, 200)) {
    const n = Number(rawGrades[k]);
    if (Number.isInteger(n) && n >= 0 && n <= 3) grades[String(k)] = n;
  }
  const updatedBy = String((body as any)?.updatedBy || '').slice(0, 80);

  const work = await saveMatrixWork(id, { notes, grades, updatedBy });
  if (!work) return NextResponse.json({ error: 'No such matrix.' }, { status: 404 });
  return NextResponse.json({ ok: true, work });
}
