import { getServerSession } from 'next-auth';
import { NextRequest } from 'next/server';
import { authOptions } from '@/lib/auth';
import { hasPermission, PERMISSIONS } from '@/lib/rbac';
import { getEffectiveRole } from '@/lib/serverRole';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { incidentId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return new Response('Unauthorized', { status: 401 });
  if (!hasPermission(getEffectiveRole(session), PERMISSIONS.INCIDENTS_RESOLVE)) {
    return new Response('Forbidden — insufficient role', { status: 403 });
  }

  try {
    const upstream = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE}/incidents/${encodeURIComponent(params.incidentId)}/resolve`,
      {
        method: 'PATCH',
        headers: { 'x-internal-key': process.env.INTERNAL_API_KEY ?? '' },
      }
    );
    const data = await upstream.json();
    return Response.json(data, { status: upstream.status });
  } catch {
    return new Response('Upstream error', { status: 502 });
  }
}
