import { NextRequest, NextResponse } from 'next/server';
import { getSettings, setSettings } from '@/lib/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const settings = await getSettings();
  return NextResponse.json({ settings });
}

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  await setSettings({ clientName: String(body?.clientName || ''), roleLabel: String(body?.roleLabel || '') });
  const settings = await getSettings();
  return NextResponse.json({ settings });
}
