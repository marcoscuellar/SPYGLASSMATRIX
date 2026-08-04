import { Flow } from '@/components/Flow';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default function Home() {
  requireAuth();
  return <Flow />;
}
