// ── TEMPORARY testing helper — see lib/devRole.ts ──────────────
import { cookies } from 'next/headers';
import { Session } from 'next-auth';
import { Role } from '@/config/roles';
import { DEV_ROLE_COOKIE, DEV_ROLE_SWITCH_ENABLED, isValidRole } from '@/lib/devRole';

// Server-side equivalent of the client's useRole(): returns the dev
// override (if the switch is enabled and a valid cookie is set), else
// falls back to the real role from the session.
export function getEffectiveRole(session: Session): Role {
  if (DEV_ROLE_SWITCH_ENABLED) {
    const override = cookies().get(DEV_ROLE_COOKIE)?.value;
    if (isValidRole(override)) return override;
  }
  return session.user.role;
}
