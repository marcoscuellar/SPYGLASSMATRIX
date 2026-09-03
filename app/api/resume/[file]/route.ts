import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';
import { hasPortalAccess } from '@/lib/portal-access';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/* Résumés used to sit in /public, where they were served straight off the CDN
   with no idea a door existed — anyone who knew or guessed the filename had a
   candidate's full employment history. They now live outside /public and come
   through here, behind the same check as the shortlist. */

const DIR = path.join(process.cwd(), 'private', 'resumes');

const TYPES: Record<string, string> = {
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.doc': 'application/msword',
  '.pdf': 'application/pdf',
};

export async function GET(_req: NextRequest, { params }: { params: { file: string } }) {
  if (!hasPortalAccess()) return NextResponse.json({ error: 'Not authorised.' }, { status: 401 });

  // The filename comes from the URL, so treat it as hostile: allow a plain
  // name only, no separators and no dots to climb out of the directory.
  const name = params.file;
  if (!/^[A-Za-z0-9._-]+$/.test(name) || name.includes('..')) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  const ext = path.extname(name).toLowerCase();
  if (!TYPES[ext]) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const full = path.join(DIR, name);
  // Belt and braces: the resolved path must still be inside the directory.
  if (path.dirname(full) !== DIR) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  let buf: Buffer;
  try {
    buf = await readFile(full);
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(buf), {
    headers: {
      'content-type': TYPES[ext],
      'content-disposition': `attachment; filename="${name}"`,
      'cache-control': 'private, no-store, max-age=0',
      'x-robots-tag': 'noindex, nofollow',
    },
  });
}
