import { Responder, Device } from '@/types';

export const RESPONDERS: Responder[] = [
  { id: 'torres', name: 'SGT. M. Torres', rank: 'SGT', unit: 'Unit 4', device_id: 'xreal-07', status: 'LIVE', initials: 'MT' },
  { id: 'chen',   name: 'CPL. A. Chen',   rank: 'CPL', unit: 'Unit 2', device_id: 'xreal-14', status: 'LIVE', initials: 'AC' },
  { id: 'reyes',  name: 'PFC. D. Reyes',  rank: 'PFC', unit: 'Unit 1', device_id: 'xreal-03', status: 'ONLINE', initials: 'DR' },
  { id: 'park',   name: 'SGT. L. Park',   rank: 'SGT', unit: 'Unit 6', device_id: 'xreal-22', status: 'IDLE', initials: 'LP' },
  { id: 'james',  name: 'CPL. R. James',  rank: 'CPL', unit: 'Unit 3', device_id: 'xreal-11', status: 'OFFLINE', initials: 'RJ' },
];

export const DEVICES: Device[] = [
  { id: 'xreal-07', model: 'XREAL Air 2 Ultra', serial: '#07', assigned_to: 'SGT. M. Torres', unit: 'Unit 4', status: 'LIVE',    last_active: null },
  { id: 'xreal-14', model: 'XREAL One Pro',     serial: '#14', assigned_to: 'CPL. A. Chen',   unit: 'Unit 2', status: 'LIVE',    last_active: null },
  { id: 'xreal-03', model: 'XREAL Air 2 Ultra', serial: '#03', assigned_to: 'PFC. D. Reyes',  unit: 'Unit 1', status: 'ONLINE',  last_active: '2m ago' },
  { id: 'xreal-22', model: 'XREAL One Pro',     serial: '#22', assigned_to: 'SGT. L. Park',   unit: 'Unit 6', status: 'IDLE',    last_active: '18m ago' },
  { id: 'xreal-11', model: 'XREAL Air 2 Ultra', serial: '#11', assigned_to: 'CPL. R. James',  unit: 'Unit 3', status: 'OFFLINE', last_active: '3h ago' },
];

export const INCIDENT_TYPES = [
  { value: 'GSW',      label: 'GSW — Gunshot Wound' },
  { value: 'STAB',     label: 'STAB — Penetrating Trauma' },
  { value: 'BLUNT',    label: 'BLUNT — Blunt Force Trauma' },
  { value: 'BURN',     label: 'BURN — Thermal Injury' },
  { value: 'FRACTURE', label: 'FRACTURE — Skeletal Injury' },
  { value: 'CRUSH',    label: 'CRUSH — Crush Injury' },
];
