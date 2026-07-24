import { Device } from '@/types';

export type DeviceAlertType = 'offline' | 'low_battery' | 'sync_failure';
export type DeviceAlertSeverity = 'critical' | 'warning';

export interface DeviceAlert {
  deviceId: string;
  type: DeviceAlertType;
  severity: DeviceAlertSeverity;
  message: string;
}

const LOW_BATTERY_CRITICAL = 20;
const LOW_BATTERY_WARNING = 35;

export function getDeviceAlerts(devices: Device[]): DeviceAlert[] {
  const alerts: DeviceAlert[] = [];

  devices.forEach((d) => {
    if (d.status === 'OFFLINE') {
      alerts.push({ deviceId: d.id, type: 'offline', severity: 'critical', message: `${d.model} ${d.serial} has gone offline · last sync ${d.last_sync}` });
    }
    if (d.battery_pct < LOW_BATTERY_CRITICAL) {
      alerts.push({ deviceId: d.id, type: 'low_battery', severity: 'critical', message: `${d.model} ${d.serial} battery critical at ${d.battery_pct}%` });
    } else if (d.battery_pct < LOW_BATTERY_WARNING) {
      alerts.push({ deviceId: d.id, type: 'low_battery', severity: 'warning', message: `${d.model} ${d.serial} battery low at ${d.battery_pct}%` });
    }
    if (d.sync_failed) {
      alerts.push({ deviceId: d.id, type: 'sync_failure', severity: 'warning', message: `${d.model} ${d.serial} failed to sync telemetry · last successful sync ${d.last_sync}` });
    }
  });

  return alerts;
}
