import { AdminView } from '@/components/AdminView';
import { getSettings, listCandidates, isPersistent } from '@/lib/store';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  requireAuth();
  const [initial, settings] = await Promise.all([listCandidates(), getSettings()]);
  return <AdminView initial={initial} settings={settings} persistent={isPersistent()} />;
}
