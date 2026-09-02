import { NextResponse } from 'next/server';
import { hasAccess } from '@/lib/access';
import { addSubmission, getMatrix, markSubmissionEmailed } from '@/lib/store';
import { sendSubmissionEmail } from '@/lib/mail';
import type { SubmissionRead, SubmissionResume } from '@/lib/types';

export const dynamic = 'force-dynamic';

const MAX_RESUME = 3 * 1024 * 1024; // 3MB, as the form promises
const OK_EXT = ['.pdf', '.doc', '.docx', '.rtf', '.txt', '.md'];
const READS: SubmissionRead[] = ['advance', 'fence', 'pass'];

export async function POST(req: Request) {
  if (!hasAccess()) return NextResponse.json({ error: 'Locked.' }, { status: 401 });

  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: 'Could not read the form.' }, { status: 400 });

  const str = (k: string, max: number) => String(form.get(k) ?? '').trim().slice(0, max);
  const matrixId = str('matrixId', 100);
  const recruiterName = str('recruiterName', 120);
  const recruiterEmail = str('recruiterEmail', 200);
  const candidateName = str('candidateName', 160);
  const notes = str('notes', 20000);
  const readRaw = str('read', 20) as SubmissionRead;

  if (!recruiterName) return NextResponse.json({ error: 'Add your name so Marcos knows who screened them.' }, { status: 400 });
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(recruiterEmail)) return NextResponse.json({ error: 'Add a valid email so Marcos can reply.' }, { status: 400 });
  if (!candidateName) return NextResponse.json({ error: 'Add the candidate’s name.' }, { status: 400 });
  if (!READS.includes(readRaw)) return NextResponse.json({ error: 'Pick your read: advance, on the fence, or pass.' }, { status: 400 });

  const matrix = await getMatrix(matrixId);
  if (!matrix) return NextResponse.json({ error: 'No such role.' }, { status: 404 });

  let resume: SubmissionResume | null = null;
  const file = form.get('resume');
  if (file && typeof file === 'object' && 'arrayBuffer' in file) {
    const f = file as File;
    if (f.size > 0) {
      if (f.size > MAX_RESUME) {
        return NextResponse.json({ error: 'That résumé is over 3MB. Send a smaller file.' }, { status: 400 });
      }
      const name = f.name || 'resume';
      if (!OK_EXT.some((e) => name.toLowerCase().endsWith(e))) {
        return NextResponse.json({ error: 'Résumé must be a PDF, Word, RTF or text file.' }, { status: 400 });
      }
      const buf = Buffer.from(await f.arrayBuffer());
      resume = { filename: name, mime: f.type || 'application/octet-stream', size: buf.length, data: buf.toString('base64') };
    }
  }

  // Store first — an email that fails to send must not lose the candidate.
  const sub = await addSubmission({
    matrixId,
    roleTitle: matrix.matrix.jd.title || '',
    client: matrix.matrix.client || '',
    recruiterName, recruiterEmail, candidateName,
    read: readRaw, notes, resume,
  });

  const emailed = await sendSubmissionEmail(sub);
  if (emailed) await markSubmissionEmailed(sub.id, true);

  return NextResponse.json({ ok: true, id: sub.id, emailed });
}
