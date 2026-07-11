import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

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
];

export default withAuth(
  function middleware(req) {
    const role = req.nextauth.token?.role;
    const { pathname } = req.nextUrl;

    if (role === 'patient' && OPERATIONS_ROUTES.some((route) => pathname.startsWith(route))) {
      return NextResponse.redirect(new URL('/my-sessions', req.url));
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
