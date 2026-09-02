import { SubmissionsView } from '@/components/SubmissionsView';
import { requireAuth } from '@/lib/auth';
import { listSubmissions } from '@/lib/store';
import { mailConfigured } from '@/lib/mail';

export const dynamic = 'force-dynamic';

export default async function SubmissionsPage() {
  // Candidates' names, notes and résumés live here — internal login only.
  requireAuth();
  const subs = await listSubmissions();
  return <SubmissionsView subs={subs} mailOn={mailConfigured()} />;
}
