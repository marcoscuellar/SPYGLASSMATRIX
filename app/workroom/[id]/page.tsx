import { notFound, redirect } from 'next/navigation';
import { WorkroomMatrix } from '@/components/WorkroomMatrix';
import { hasAccess } from '@/lib/access';
import { getMatrix } from '@/lib/store';

export const dynamic = 'force-dynamic';

export default async function WorkroomMatrixPage({ params }: { params: { id: string } }) {
  // Gate before the lookup so a locked visitor cannot probe which ids exist.
  if (!hasAccess()) redirect('/workroom');
  const stored = await getMatrix(params.id);
  if (!stored) notFound();
  return <WorkroomMatrix stored={stored} />;
}
