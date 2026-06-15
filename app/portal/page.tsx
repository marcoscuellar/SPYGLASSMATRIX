import { PortalView } from '@/components/PortalView';
import { listCandidates } from '@/lib/store';

export const dynamic = 'force-dynamic';

export default async function PortalPage() {
  const initial = await listCandidates();
  return <PortalView initial={initial} />;
}
