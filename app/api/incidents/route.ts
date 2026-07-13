import { getServerSession } from 'next-auth';
import { NextRequest } from 'next/server';
import { authOptions } from '@/lib/auth';
import { hasPermission, PERMISSIONS } from '@/lib/rbac';
import { forwardToBackend } from '@/lib/backend';
import { getEffectiveRole } from '@/lib/serverRole';

// Incident feed — admin/doctor only. Patients have no concept of
// "their own" incident (it's operational dispatch data, not per-patient),
// so they're blocked outright rather than filtered.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return new Response('Unauthorized', { status: 401 });
  if (!hasPermission(getEffectiveRole(session), PERMISSIONS.OPERATIONS_VIEW)) {
    return new Response('Forbidden — insufficient role', { status: 403 });
  }

  const { status, data } = await forwardToBackend('/incidents');
  return Response.json(data, { status });
}

// Server-side enforced: only roles with INCIDENTS_CREATE can reach the
// backend's write endpoint. The browser never talks to the Express API
// directly for this action — see lib/api.ts.
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return new Response('Unauthorized', { status: 401 });
  if (!hasPermission(getEffectiveRole(session), PERMISSIONS.INCIDENTS_CREATE)) {
    return new Response('Forbidden — insufficient role', { status: 403 });
  }

  const body = await request.json();

  try {
    const upstream = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/incidents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-key': process.env.INTERNAL_API_KEY ?? '',
      },
      body: JSON.stringify({ ...body, created_by: session.user.email }),
    });
    const data = await upstream.json();
    return Response.json(data, { status: upstream.status });
  } catch {
    return new Response('Upstream error', { status: 502 });
  }
}
