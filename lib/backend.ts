// Server-only helper for calling the Express backend. Never import this
// from a client component — it attaches the shared internal key that
// authorizes calls to the backend's protected routes.
export async function forwardToBackend(path: string, init: RequestInit = {}) {
  const upstream = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}${path}`, {
    ...init,
    headers: {
      ...(init.headers || {}),
      'x-internal-key': process.env.INTERNAL_API_KEY ?? '',
    },
  });
  const data = await upstream.json().catch(() => null);
  return { status: upstream.status, data };
}
