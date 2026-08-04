import { TeamView } from '@/components/TeamView';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Spyglass Matrix — Team' };

export default function TeamPage() {
  requireAuth();
  return <TeamView />;
}
