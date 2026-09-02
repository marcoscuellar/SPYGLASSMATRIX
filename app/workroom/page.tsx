import { WorkroomGate } from '@/components/WorkroomGate';
import { WorkroomList } from '@/components/WorkroomList';
import { hasAccess, usingDefaultCode } from '@/lib/access';
import { isPersistent, listMatrices } from '@/lib/store';

export const dynamic = 'force-dynamic';

export default async function WorkroomPage() {
  if (!hasAccess()) {
    return (
      <WorkroomGate
        hint={usingDefaultCode() ? 'This deployment is still on the built-in default code. Set WORKROOM_ACCESS_CODE to your own.' : ''}
      />
    );
  }
  const matrices = await listMatrices();
  return <WorkroomList matrices={matrices} persistent={isPersistent()} />;
}
