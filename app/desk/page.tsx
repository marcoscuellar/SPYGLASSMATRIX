import { DeskView } from '@/components/DeskView';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Spyglass Matrix — The Desk' };

export default function DeskPage() {
  requireAuth();
  return <DeskView />;
}
