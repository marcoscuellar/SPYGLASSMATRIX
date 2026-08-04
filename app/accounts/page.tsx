import { AccountsView } from '@/components/AccountsView';
import { requireAdmin } from '@/lib/auth';
import { listUsers } from '@/lib/store';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Spyglass Matrix — Accounts' };

export default async function AccountsPage() {
  requireAdmin();
  const initial = await listUsers();
  return <AccountsView initial={initial} />;
}
