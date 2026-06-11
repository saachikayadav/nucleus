import { TriageCategory } from '@/types';

export function pwatColor(score: number): string {
  if (score >= 12) return 'var(--red)';
  if (score >= 8)  return 'var(--amber)';
  if (score >= 4)  return '#fde047';
  return 'var(--green)';
}

export function triageClass(t: string): string {
  const map: Record<string, string> = {
    Red: 't-red', Orange: 't-stab', Yellow: 't-yellow', Green: 't-fracture',
  };
  return map[t] ?? 't-blunt';
}

export function triageColor(t: string): string {
  const map: Record<string, string> = {
    Red: 'var(--red)', Orange: 'var(--amber)', Yellow: '#fde047', Green: 'var(--green)',
  };
  return map[t] ?? 'rgba(255,255,255,0.3)';
}

export function depthSeverityColor(s: string | null): string {
  if (!s) return 'var(--text2)';
  const map: Record<string, string> = {
    'Superficial':    'var(--green)',
    'Moderate':       '#fde047',
    'Deep':           'var(--amber)',
    'Severe':         'var(--red)',
    'Severe / Cavity':'var(--red)',
    'Cavity':         'var(--red)',
  };
  return map[s] ?? 'var(--text2)';
}

export function formatTime(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString([], {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export function formatDateShort(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export function bucketPwat(sessions: { pwat_score: number }[]) {
  const buckets = [
    { range: '0–4',   min: 0,  max: 4,  count: 0 },
    { range: '4–8',   min: 4,  max: 8,  count: 0 },
    { range: '8–12',  min: 8,  max: 12, count: 0 },
    { range: '12–16', min: 12, max: 16, count: 0 },
    { range: '16–20', min: 16, max: 20, count: 0 },
  ];
  sessions.forEach(s => {
    const b = buckets.find(b => s.pwat_score >= b.min && s.pwat_score < b.max);
    if (b) b.count++;
    else if (s.pwat_score >= 20) buckets[4].count++;
  });
  return buckets;
}

export function groupByDate(sessions: { created_at: string }[]) {
  const map: Record<string, number> = {};
  sessions.forEach(s => {
    const d = s.created_at?.slice(0, 10);
    if (d) map[d] = (map[d] || 0) + 1;
  });
  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }));
}

export function groupByHour(sessions: { created_at: string }[]) {
  const hours = Array.from({ length: 24 }, (_, i) => ({ hour: i, count: 0 }));
  sessions.forEach(s => {
    if (s.created_at) {
      const h = new Date(s.created_at).getHours();
      hours[h].count++;
    }
  });
  return hours;
}

export function generateIncidentId(): string {
  return `INC-${Date.now().toString().slice(-6)}`;
}

export function triageBadgeClass(t: TriageCategory | string): string {
  return `triage-badge triage-${t}`;
}
