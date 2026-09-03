import { PortalView } from '@/components/PortalView';
import { getSettings, listCandidates } from '@/lib/store';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function PortalPage() {
  const [initial, settings] = await Promise.all([listCandidates(), getSettings()]);
  // Public for the client; the edit layer appears only for a logged-in session.
  return <PortalView initial={initial} settings={settings} canEdit={!!getSession()} />;
}
