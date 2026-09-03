import { PortalView } from '@/components/PortalView';
import { PortalGate } from '@/components/PortalGate';
import { getSettings, listCandidates } from '@/lib/store';
import { getSession } from '@/lib/auth';
import { hasPortalAccess } from '@/lib/portal-access';

export const dynamic = 'force-dynamic';

export default async function PortalPage() {
  const settings = await getSettings();

  // The door, when one is configured. It renders at /portal itself so the
  // client's link never changes: type the code, land in the shortlist.
  // Nothing about the candidates is loaded or sent until they are through it.
  if (!hasPortalAccess()) {
    return <PortalGate client={settings.clientName} role={settings.roleLabel} />;
  }

  const initial = await listCandidates();
  // Public for the client; the edit layer appears only for a logged-in session.
  return <PortalView initial={initial} settings={settings} canEdit={!!getSession()} />;
}
