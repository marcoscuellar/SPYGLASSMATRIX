import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 30;

// POST /api/parse-document (multipart/form-data with `file`)
// Extracts plain text from an uploaded JD — PDF, DOCX, or text — so the
// Builder can read the brief and pre-populate the engagement fields.
// Binary parsing happens server-side (the prototype could only read text).
export async function POST(req: NextRequest) {
  let file: File | null = null;
  try {
    const form = await req.formData();
    const f = form.get('file');
    if (f instanceof File) file = f;
  } catch {
    return NextResponse.json({ error: 'Expected multipart/form-data with a file.' }, { status: 400 });
  }
  if (!file) return NextResponse.json({ error: 'No file provided.' }, { status: 400 });

  const name = file.name || '';
  const ext = name.split('.').pop()?.toLowerCase() || '';
  const buf = Buffer.from(await file.arrayBuffer());

  try {
    let text = '';

    if (ext === 'pdf' || file.type === 'application/pdf') {
      const { extractText, getDocumentProxy } = await import('unpdf');
      const pdf = await getDocumentProxy(new Uint8Array(buf));
      const res = await extractText(pdf, { mergePages: true });
      text = Array.isArray(res.text) ? res.text.join('\n') : res.text;
    } else if (ext === 'docx' || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const mammoth = (await import('mammoth')).default;
      const res = await mammoth.extractRawText({ buffer: buf });
      text = res.value;
    } else if (ext === 'doc') {
      // Legacy .doc (binary) isn't reliably parseable; surface a clear hint.
      return NextResponse.json({ text: '', error: 'Legacy .doc isn’t supported — save as PDF or .docx, or paste the text.' }, { status: 415 });
    } else {
      // txt / md / csv / rtf / json and anything else: treat as UTF-8 text.
      text = buf.toString('utf-8');
    }

    return NextResponse.json({ text: (text || '').trim() });
  } catch (err) {
    console.error('parse-document failed', err);
    return NextResponse.json({ text: '', error: 'Could not read this file. Try a PDF/DOCX or paste the text.' }, { status: 422 });
  }
}
