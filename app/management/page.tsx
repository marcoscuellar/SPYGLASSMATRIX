import { ManagementView } from '@/components/ManagementView';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Spyglass Matrix — Management' };

export default function ManagementPage() {
  requireAuth();
  return <ManagementView />;
}
