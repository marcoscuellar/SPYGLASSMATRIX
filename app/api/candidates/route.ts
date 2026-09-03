import { NextRequest, NextResponse } from 'next/server';
import { addCandidate, listCandidates } from '@/lib/store';
import { getSession } from '@/lib/auth';
import { parseCandidateInput } from '@/lib/candidate-input';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const candidates = await listCandidates();
  return NextResponse.json({ candidates });
}

export async function POST(req: NextRequest) {
  // Creating a candidate is an internal action; the portal page is public but
  // its write endpoints are not.
  if (!getSession()) return NextResponse.json({ error: 'Not authorised.' }, { status: 401 });
  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }); }
  const input = parseCandidateInput(body);
  if (!input.name) return NextResponse.json({ error: 'Name is required.' }, { status: 422 });
  const candidate = await addCandidate(input);
  return NextResponse.json({ candidate });
}
