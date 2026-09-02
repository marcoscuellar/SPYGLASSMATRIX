/* ============================================================
   Spyglass Matrix — outbound notification (server-only)
   Sends the "new submission" email through Resend's HTTP API, so
   there is no SMTP dependency to install or keep alive. Returns
   false (never throws) when unconfigured or when the call fails —
   the submission is already stored, so a failed email is a missing
   notification, not a lost candidate.
   ============================================================ */
import type { Submission } from './types';

const READ_LABEL: Record<string, string> = {
  advance: 'Advance',
  fence: 'On the fence',
  pass: 'Pass',
};

export function mailConfigured(): boolean {
  return !!(process.env.RESEND_API_KEY && process.env.SUBMISSIONS_EMAIL_TO);
}

export async function sendSubmissionEmail(s: Submission): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  const to = process.env.SUBMISSIONS_EMAIL_TO;
  if (!key || !to) return false;
  const from = process.env.SUBMISSIONS_EMAIL_FROM || 'Spyglass Matrix <onboarding@resend.dev>';

  const esc = (v: unknown) =>
    String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const html = `
    <div style="font-family:-apple-system,Segoe UI,Arial,sans-serif;color:#1c2430;line-height:1.55">
      <p style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#0E7C84;margin:0 0 4px">
        New submission · ${esc(s.roleTitle)}${s.client ? ' · ' + esc(s.client) : ''}
      </p>
      <h2 style="margin:0 0 4px;color:#0A1F3D">${esc(s.candidateName)}</h2>
      <p style="margin:0 0 16px;color:#5b6777">
        ${esc(READ_LABEL[s.read] || s.read)} — from ${esc(s.recruiterName)}
        &lt;${esc(s.recruiterEmail)}&gt;
      </p>
      <div style="border-left:3px solid #0E7C84;padding:2px 0 2px 14px;white-space:pre-wrap">${esc(s.notes) || '<i>No notes.</i>'}</div>
      <p style="margin:18px 0 0;font-size:13px;color:#5b6777">
        ${s.resume ? 'Résumé attached: ' + esc(s.resume.filename) : 'No résumé attached.'}
      </p>
    </div>`;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        from,
        to: [to],
        // So Marcos can hit reply and reach the recruiter directly.
        reply_to: s.recruiterEmail || undefined,
        subject: `${READ_LABEL[s.read] || s.read} · ${s.candidateName} — ${s.roleTitle}`,
        html,
        attachments: s.resume ? [{ filename: s.resume.filename, content: s.resume.data }] : undefined,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
