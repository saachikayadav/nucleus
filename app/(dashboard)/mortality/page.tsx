'use client';
import { useIncidents } from '@/hooks';
import { formatDate } from '@/lib/utils';
import { predictedRiskPct, predictedOutcomeDeceased } from '@/lib/risk';
import { INCIDENT_TYPES } from '@/config/fleet';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const injuryLabel = (t: string) => INCIDENT_TYPES.find(i => i.value === t)?.label.split(' — ')[1] ?? t;
const riskColor = (pct: number) => pct >= 20 ? 'var(--red)' : pct >= 10 ? 'var(--amber)' : 'var(--green)';

export default function MortalityPage() {
  const { data: incidentsData, isLoading } = useIncidents();
  const incidents = incidentsData?.incidents ?? [];

  const active = incidents.filter(i => i.status === 'Active');
  const resolved = incidents.filter(i => i.status === 'Resolved');

  const activeWithRisk = active
    .map(i => ({ ...i, risk: predictedRiskPct(i) }))
    .sort((a, b) => b.risk - a.risk);

  const avgActiveRisk = active.length > 0 ? activeWithRisk.reduce((sum, i) => sum + i.risk, 0) / active.length : 0;
  const highestRisk = activeWithRisk[0];

  const resolvedWithOutcome = resolved.map(i => ({ ...i, risk: predictedRiskPct(i), deceased: predictedOutcomeDeceased(i) }));
  const overallMortalityRate = resolvedWithOutcome.length > 0
    ? (resolvedWithOutcome.filter(i => i.deceased).length / resolvedWithOutcome.length) * 100
    : 0;

  const calibrationByType = INCIDENT_TYPES
    .map(({ value: type }) => {
      const recs = resolvedWithOutcome.filter(i => i.type === type);
      if (recs.length === 0) return null;
      const avgPredicted = recs.reduce((sum, i) => sum + i.risk, 0) / recs.length;
      const actualRate = (recs.filter(i => i.deceased).length / recs.length) * 100;
      return { type, label: injuryLabel(type), count: recs.length, predicted: Number(avgPredicted.toFixed(1)), actual: Number(actualRate.toFixed(1)) };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);

  const customTooltip = ({ active: a, payload, label }: any) => {
    if (!a || !payload?.length) return null;
    return (
      <div style={{ background:'rgba(6,12,24,0.95)', border:'1px solid var(--border-hi)', borderRadius:8, padding:'6px 12px', fontFamily:'var(--mono)', fontSize:11 }}>
        <div style={{ color:'var(--text)', marginBottom:2 }}>{label}</div>
        {payload.map((p: any) => (
          <div key={p.dataKey} style={{ color: p.color }}>{p.name}: <strong>{p.value}%</strong></div>
        ))}
      </div>
    );
  };

  return (
    <>
      <div style={{ background:'rgba(192,132,252,0.04)', border:'1px solid rgba(192,132,252,0.15)', borderRadius:10, padding:'10px 16px', marginBottom:20, fontSize:11, color:'var(--text3)', fontFamily:'var(--mono)' }}>
        ℹ Predicted risk and outcome are modeled estimates for demonstration — derived deterministically per incident, not from a live mortality-prediction service.
      </div>

      <div className="metrics-grid" style={{ marginBottom:20 }}>
        <div className="metric-card">
          <div className="metric-label">Active Incidents</div>
          <div className="metric-value" style={{ color:'var(--text)' }}>{isLoading ? '—' : active.length}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Avg Predicted Risk</div>
          <div className="metric-value" style={{ color:riskColor(avgActiveRisk) }}>{active.length ? avgActiveRisk.toFixed(1)+'%' : '—'}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Highest-Risk Active Incident</div>
          <div className="metric-value" style={{ fontSize:16, color:highestRisk?riskColor(highestRisk.risk):'var(--text)' }}>{highestRisk ? `${highestRisk.id} · ${highestRisk.risk}%` : '—'}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Historical Mortality Rate</div>
          <div className="metric-value" style={{ color:riskColor(overallMortalityRate) }}>{resolved.length ? overallMortalityRate.toFixed(1)+'%' : '—'}</div>
        </div>
      </div>

      <div className="section-hd"><div className="section-title">Active Incidents · AI-Predicted Risk</div><span className="badge badge-live">LIVE</span></div>
      <div className="card" style={{ marginBottom:20 }}>
        {isLoading ? (
          <div style={{ padding:'20px 18px' }}>{[...Array(2)].map((_,i) => <div key={i} className="skeleton" style={{ height:14, marginBottom:10 }} />)}</div>
        ) : activeWithRisk.length === 0 ? (
          <div style={{ padding:'20px 18px', textAlign:'center', color:'var(--text3)', fontFamily:'var(--mono)', fontSize:12 }}>No active incidents right now.</div>
        ) : (
          <div style={{ overflowX:'auto' }}>
          <table className="data-table">
            <thead><tr><th>ID</th><th>Type</th><th>Responder</th><th>Location</th><th>Deployed</th><th>Predicted Risk</th></tr></thead>
            <tbody>
              {activeWithRisk.map(i => (
                <tr key={i.id}>
                  <td style={{ fontFamily:'var(--mono)', color:'var(--text)', fontWeight:600 }}>{i.id}</td>
                  <td><span className="feed-type t-gsw">{i.type}</span></td>
                  <td style={{ color:'var(--text)' }}>{i.responder}</td>
                  <td>{i.location}</td>
                  <td style={{ fontFamily:'var(--mono)', fontSize:11 }}>{formatDate(i.created_at)}</td>
                  <td style={{ fontFamily:'var(--mono)', fontWeight:700, color:riskColor(i.risk) }}>{i.risk}%</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>

      <div className="section-hd"><div className="section-title">Post-Incident Outcome Tracking · Predicted vs. Actual</div></div>
      <div className="card">
        {resolvedWithOutcome.length === 0 ? (
          <div style={{ padding:'20px 18px', textAlign:'center', color:'var(--text3)', fontFamily:'var(--mono)', fontSize:12 }}>
            No resolved incidents yet — outcome calibration will appear here once incidents are resolved.
          </div>
        ) : (
          <div style={{ padding:'16px 18px' }}>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={calibrationByType} barSize={20}>
                <XAxis dataKey="label" tick={{ fill:'rgba(240,244,255,0.35)', fontSize:10, fontFamily:'JetBrains Mono' }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip content={customTooltip} />
                <Legend wrapperStyle={{ fontSize:11, fontFamily:'var(--mono)' }} />
                <Bar dataKey="predicted" name="Predicted Risk (at dispatch)" fill="var(--cyan)" radius={[4,4,0,0]} />
                <Bar dataKey="actual" name="Actual Outcome Rate" fill="var(--red)" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </>
  );
}
