'use client';

import { ReactNode, useId, useState } from 'react';

export const METRIC_DESCRIPTIONS = {
  totalCases: 'The total number of wound-assessment sessions currently available in Nucleus.',
  avgPwat: 'The mean Photographic Wound Assessment Tool (PWAT) score across the sessions shown. Higher scores indicate greater wound severity.',
  maxPwat: 'The highest PWAT score in the sessions shown, highlighting the most severe recorded assessment.',
  critical: 'Sessions assigned to the Red triage category and requiring immediate clinical review.',
  highPriority: 'Sessions assigned to Red or Orange triage, indicating immediate or near-term review is needed.',
  stable: 'Sessions assigned to Green triage, indicating healing or stability within the configured thresholds.',
  modelVersion: 'The version of the AI scoring model associated with these performance results.',
  aiSessions: 'The number of sessions that have received an AI-generated wound assessment.',
  triage: 'The distribution of sessions across Red, Orange, Yellow, and Green urgency categories.',
  pwat: 'PWAT is the Photographic Wound Assessment Tool score. It summarizes visible wound characteristics; higher values indicate greater severity.',
  pwatDistribution: 'The number of assessed sessions within each PWAT severity range.',
  sessionsOverTime: 'The number of wound-assessment sessions recorded on each date.',
  depthSeverity: 'A breakdown of sessions by the AI-estimated wound-depth severity category.',
  woundArea: 'The estimated wound area as a percentage of the analyzed image or region of interest.',
  depthMean: 'The model-estimated mean depth across the detected wound region.',
  accuracy: 'The share of model recommendations that agreed with licensed physician validation in the static benchmark dataset.',
} as const;

export function MetricInfo({ label, description, children, className = '' }: {
  label: string;
  description: string;
  children?: ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const id = `metric-info-${useId().replace(/:/g, '')}`;

  return (
    <span
      className={`metric-info ${className}`}
      tabIndex={0}
      aria-label={`${label}. ${description}`}
      aria-describedby={open ? id : undefined}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      onClick={() => setOpen(value => !value)}
      onKeyDown={event => { if (event.key === 'Escape') setOpen(false); }}
    >
      {children ?? label}
      <span className="metric-info-dot" aria-hidden="true">i</span>
      {open && <span id={id} role="tooltip" className="metric-info-popover">{description}</span>}
    </span>
  );
}

export function DescribedMetricCard({ label, description, value, sub, color, bg, valueStyle }: {
  label: string;
  description: string;
  value: ReactNode;
  sub?: ReactNode;
  color: string;
  bg: string;
  valueStyle?: React.CSSProperties;
}) {
  return (
    <div className={`metric-card ${bg}`}>
      <div className="metric-label"><MetricInfo label={label} description={description} /></div>
      <div className={`metric-value ${color}`} style={valueStyle}>{value}</div>
      {sub && <div className="metric-delta">{sub}</div>}
    </div>
  );
}
