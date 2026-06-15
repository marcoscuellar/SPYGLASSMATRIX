import { PortalView } from '@/components/PortalView';
import { getSettings, listCandidates } from '@/lib/store';

export const dynamic = 'force-dynamic';

export default async function PortalPage() {
  const [initial, settings] = await Promise.all([listCandidates(), getSettings()]);
  return <PortalView initial={initial} settings={settings} />;
}
