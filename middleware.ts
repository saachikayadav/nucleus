import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import { DEV_ROLE_COOKIE, DEV_ROLE_SWITCH_ENABLED, isValidRole } from '@/lib/devRole';
import { hasPermission, PERMISSIONS } from '@/lib/rbac';

// Command-center / operational pages — aggregate data across all patients.
// Patients are redirected away from these to their own session list.
const OPERATIONS_ROUTES = [
  '/overview',
  '/incidents',
  '/analytics',
  '/reports',
  '/responders',
  '/devices',
  '/ai-performance',
  '/heatmaps',
  '/escalations',
  '/mortality',
];

// Routes further restricted to admin (doctors have OPERATIONS_VIEW but not
// these) — anyone lacking the permission is bounced to /overview.
const RESTRICTED_ROUTES: [string, (typeof PERMISSIONS)[keyof typeof PERMISSIONS]][] = [
  ['/ai-performance', PERMISSIONS.AI_PERFORMANCE_VIEW],
  ['/analytics', PERMISSIONS.ANALYTICS_VIEW],
  ['/responders', PERMISSIONS.RESPONDERS_VIEW],
  ['/devices', PERMISSIONS.DEVICES_VIEW],
];

export default withAuth(
  function middleware(req) {
    // TEMPORARY testing override — see lib/devRole.ts. No-ops unless
    // NEXT_PUBLIC_ENABLE_DEV_ROLE_SWITCH=true.
    const devOverride = DEV_ROLE_SWITCH_ENABLED
      ? req.cookies.get(DEV_ROLE_COOKIE)?.value
      : undefined;
    const role = isValidRole(devOverride) ? devOverride : req.nextauth.token?.role;
    const { pathname } = req.nextUrl;

    if (role === 'patient' && OPERATIONS_ROUTES.some((route) => pathname.startsWith(route))) {
      return NextResponse.redirect(new URL('/my-sessions', req.url));
    }

    const restricted = RESTRICTED_ROUTES.find(([route]) => pathname.startsWith(route));
    if (restricted && !hasPermission(role, restricted[1])) {
      return NextResponse.redirect(new URL('/overview', req.url));
    }

    return NextResponse.next();
  },
  {
    pages: { signIn: '/auth/signin' },
  }
);

export const config = {
  matcher: ['/((?!auth|api/auth|_next/static|_next/image|favicon.ico).*)'],
};
