// ── Role assignments ───────────────────────────────────────────
// Static allowlist mapping authorized Google accounts to a role.
// Anyone who signs in with Google but isn't listed here gets
// DEFAULT_ROLE (the most restricted role). To promote/demote a
// teammate, just edit the map below and redeploy — no database
// involved.
//
// Roles:
//   admin    full access — incidents, settings, danger zone, all patients
//   doctor   can deploy/resolve incidents, view all patients/operations
//   patient  can only view their own sessions (see /my-sessions) —
//            this is the safe default for anyone not explicitly listed

export type Role = 'admin' | 'doctor' | 'patient';

export const DEFAULT_ROLE: Role = 'patient';

export const ROLE_ASSIGNMENTS: Record<string, Role> = {
  'saachika.yadav@valkyratechnologies.com': 'admin',
  'saachikay@gmail.com': 'doctor',
  // 'doctor@example.com': 'doctor',
};

export function getRoleForEmail(email?: string | null): Role {
  if (!email) return DEFAULT_ROLE;
  return ROLE_ASSIGNMENTS[email.toLowerCase()] ?? DEFAULT_ROLE;
}
