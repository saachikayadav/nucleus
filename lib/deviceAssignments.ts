import { RESPONDERS, DEVICES } from '@/config/fleet';
import { Responder, Device } from '@/types';

export type DeviceAssignments = Record<string, string | null>;

export function getDefaultAssignments(): DeviceAssignments {
  const map: DeviceAssignments = {};
  DEVICES.forEach((d) => {
    map[d.id] = RESPONDERS.find((r) => r.device_id === d.id)?.id ?? null;
  });
  return map;
}

export function getResponderForDevice(deviceId: string, assignments: DeviceAssignments): Responder | undefined {
  const responderId = assignments[deviceId];
  if (!responderId) return undefined;
  return RESPONDERS.find((r) => r.id === responderId);
}

export function getDeviceForResponder(responderId: string, assignments: DeviceAssignments): Device | undefined {
  const deviceId = Object.entries(assignments).find(([, rId]) => rId === responderId)?.[0];
  return deviceId ? DEVICES.find((d) => d.id === deviceId) : undefined;
}
