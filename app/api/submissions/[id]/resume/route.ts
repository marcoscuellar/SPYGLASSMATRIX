import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getSubmission } from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  // Résumés are candidates' personal data — the internal login only, never the
  // workroom code and never the client portal.
  requireAuth();
  const sub = await getSubmission(params.id);
  if (!sub?.resume) return NextResponse.json({ error: 'No résumé on this submission.' }, { status: 404 });

  const body = Buffer.from(sub.resume.data, 'base64');
  return new NextResponse(body, {
    headers: {
      'content-type': sub.resume.mime || 'application/octet-stream',
      'content-disposition': `attachment; filename="${sub.resume.filename.replace(/"/g, '')}"`,
      'content-length': String(body.length),
    },
  });
}
