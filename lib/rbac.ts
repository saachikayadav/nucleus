import { Role } from '@/config/roles';

export const PERMISSIONS = {
  INCIDENTS_CREATE: 'incidents:create',
  INCIDENTS_RESOLVE: 'incidents:resolve',
  SETTINGS_MANAGE: 'settings:manage', // danger zone: reset app / clear cache
  // Access to the command-center pages (Overview, Live Incidents, Analytics,
  // Reports, Responders, AR Devices, AI Performance, Heatmaps) — these show
  // aggregate/all-patient data, so patients don't get this permission.
  OPERATIONS_VIEW: 'operations:view',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

const ALL_PERMISSIONS = Object.values(PERMISSIONS);

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin: ALL_PERMISSIONS,
  doctor: [PERMISSIONS.INCIDENTS_CREATE, PERMISSIONS.INCIDENTS_RESOLVE, PERMISSIONS.OPERATIONS_VIEW],
  patient: [],
};

export function hasPermission(role: Role | undefined | null, permission: Permission): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export const ROLE_LABELS: Record<Role, string> = {
  admin: 'Admin',
  doctor: 'Doctor',
  patient: 'Patient',
};
