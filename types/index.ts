export interface WoundMetrics {
  depth_severity: string | null;
  depth_range: number | null;
  depth_mean: number | null;
  area_pct: number | null;
}

export interface GcsOutputs {
  cropped_image: string;
  segmentation_mask: string;
  wound_mask_overlay: string;
  peri_mask_overlay: string;
  segmentation_figure: string;
  depth_figure: string;
  depth_map: string;
  gemini_report: string;
}

export type TriageCategory = 'Red' | 'Orange' | 'Yellow' | 'Green' | 'Unclassified';

export interface Session {
  session_id: string;
  source_image: string;
  pwat_score: number;
  triage_category: TriageCategory;
  gemini_analysis: string;
  created_at: string;
  wound_metrics: WoundMetrics;
  gcs_outputs: GcsOutputs;
}

export interface TriageCount {
  count: number;
  pct: number;
}

export interface Summary {
  total_cases: number;
  avg_pwat: number;
  pwat_stats: { average: number; minimum: number; maximum: number };
  triage_distribution: {
    Red: TriageCount;
    Orange: TriageCount;
    Yellow: TriageCount;
    Green: TriageCount;
  };
}

export interface PatientsResponse {
  total_returned: number;
  sessions: Session[];
}

export type IncidentType = 'GSW' | 'STAB' | 'BLUNT' | 'BURN' | 'FRACTURE' | 'CRUSH';
export type IncidentStatus = 'Active' | 'Resolved';

export interface Incident {
  id: string;
  type: IncidentType;
  responder: string;
  device: string;
  location: string;
  notes: string;
  created_at: string;
  status: IncidentStatus;
  created_by: string;
}

export interface IncidentsResponse {
  incidents: Incident[];
}

export interface Responder {
  id: string;
  name: string;
  rank: string;
  unit: string;
  device_id: string;
  status: 'LIVE' | 'ONLINE' | 'IDLE' | 'OFFLINE';
  initials: string;
}

export interface Device {
  id: string;
  model: string;
  serial: string;
  assigned_to: string;
  unit: string;
  status: 'LIVE' | 'ONLINE' | 'IDLE' | 'OFFLINE';
  last_active: string | null;
}

export interface Toast {
  id: string;
  type: 'success' | 'error';
  message: string;
}
