import { Incident, IncidentType } from '@/types';

// Illustrative baseline mortality rates (%) per injury type — used only to
// derive a stable, deterministic demo risk/outcome per incident. Not a real
// clinical model.
export const BASELINE_MORTALITY: Record<IncidentType, number> = {
  GSW: 9, CRUSH: 7, BURN: 6, STAB: 5, BLUNT: 4, FRACTURE: 1,
};

function hashToUnit(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return (hash % 1000) / 1000;
}

type RiskInput = Pick<Incident, 'id' | 'type'>;

export function predictedRiskPct(incident: RiskInput): number {
  const baseline = BASELINE_MORTALITY[incident.type] ?? 5;
  const variance = 0.6 + hashToUnit(`${incident.id}-risk`) * 1.0; // 0.6x - 1.6x
  const risk = baseline * variance;
  return Math.min(95, Math.max(1, Math.round(risk * 10) / 10));
}

export function predictedOutcomeDeceased(incident: RiskInput): boolean {
  const baseline = BASELINE_MORTALITY[incident.type] ?? 5;
  return hashToUnit(`${incident.id}-outcome`) * 100 < baseline;
}
