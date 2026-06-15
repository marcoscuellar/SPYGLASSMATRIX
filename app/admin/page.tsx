import { AdminView } from '@/components/AdminView';
import { listCandidates, isPersistent } from '@/lib/store';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const initial = await listCandidates();
  return <AdminView initial={initial} persistent={isPersistent()} />;
}
