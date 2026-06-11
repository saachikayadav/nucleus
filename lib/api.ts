import axios from 'axios';
import { Summary, PatientsResponse, Session, IncidentsResponse, Incident } from '@/types';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// ── Sessions ────────────────────────────────────────────────
export const fetchSummary = (): Promise<Summary> =>
  api.get<Summary>('/patients/summary').then(r => r.data);

export const fetchSessions = (limit = 20, offset = 0): Promise<PatientsResponse> =>
  api.get<PatientsResponse>(`/patients?limit=${limit}&offset=${offset}`).then(r => r.data);

export const fetchPatient = (id: string): Promise<Session> =>
  api.get<Session>(`/patient/${encodeURIComponent(id)}`).then(r => r.data);

export const checkHealth = (): Promise<{ status: string }> =>
  api.get<{ status: string }>('/health').then(r => r.data);

// ── Incidents ────────────────────────────────────────────────
export const fetchIncidents = (): Promise<IncidentsResponse> =>
  api.get<IncidentsResponse>('/incidents').then(r => r.data);

export const createIncident = (
  data: Omit<Incident, 'id' | 'created_at'>
): Promise<{ success: boolean; id: string }> =>
  api.post('/incidents', data).then(r => r.data);

export const resolveIncident = (id: string): Promise<{ success: boolean }> =>
  api.patch(`/incidents/${id}/resolve`).then(r => r.data);

// ── GCS Proxy URLs (through Next.js API) ──────────────────────
export const gcsImageUrl = (path: string): string =>
  `/api/proxy/image?path=${encodeURIComponent(path)}`;

export const gcsTextUrl = (path: string): string =>
  `/api/proxy/text?path=${encodeURIComponent(path)}`;
