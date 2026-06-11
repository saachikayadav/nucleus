'use client';
import { useSummary, useAllSessions } from '@/hooks';
import { bucketPwat, groupByDate, pwatColor, triageColor } from '@/lib/utils';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, LineChart, Line, CartesianGrid, ResponsiveContainer } from 'recharts';

const TRIAGE_COLORS: Record<string,string> = { Red:'#f87171', Orange:'#fbbf24', Yellow:'#fde047', Green:'#4ade80' };

export default function AnalyticsPage() {
  const { data: summary, isLoading: sl } = useSummary();
  const { data: sd, isLoading: sessL } = useAllSessions();
  const sessions = sd?.sessions ?? [];
  const triage = summary?.triage_distribution ?? {} as any;

  const pieData = ['Red','Orange','Yellow','Green'].map(k => ({ name: k, value: triage[k]?.count ?? 0 })).filter(d => d.value > 0);
  const pwatBuckets = bucketPwat(sessions);
  const timeData = groupByDate(sessions).slice(-14);

  const depthCounts: Record<string,number> = {};
  sessions.forEach(s => {
    const d = s.wound_metrics?.depth_severity ?? 'Unknown';
    depthCounts[d] = (depthCounts[d] || 0) + 1;
  });
  const depthData = Object.entries(depthCounts).map(([name, count]) => ({ name, count }));

  const total = summary?.total_cases ?? 0;
  const avg  = summary?.avg_pwat ?? 0;
  const red  = triage.Red?.count ?? 0;
  const green= triage.Green?.count ?? 0;

  const customTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{ background: 'rgba(6,12,24,0.95)', border: '1px solid var(--border-hi)', borderRadius: 8, padding: '6px 12px', fontFamily: 'var(--mono)', fontSize: 11 }}>
        <div style={{ color: 'var(--text)' }}>{payload[0]?.name ?? ''}: <strong style={{ color: 'var(--accent)' }}>{payload[0]?.value}</strong></div>
      </div>
    );
  };

  return (
    <>
      <div className="metrics-grid">
        <div className="metric-card mc-blue"><div className="metric-label">Total Cases</div><div className="metric-value cv-blue">{sl ? '—' : total}</div></div>
        <div className="metric-card mc-amber"><div className="metric-label">Avg PWAT</div><div className="metric-value cv-amber">{sl ? '—' : Number(avg).toFixed(2)}</div></div>
        <div className="metric-card mc-red"><div className="metric-label">High Priority</div><div className="metric-value cv-red">{sl ? '—' : red + (triage.Orange?.count ?? 0)}<span style={{fontSize:14,color:'var(--text3)',fontWeight:400}}> Red+Orange</span></div></div>
        <div className="metric-card mc-cyan"><div className="metric-label">Stable (Green)</div><div className="metric-value cv-green">{sl ? '—' : green}</div></div>
      </div>

      <div className="mid-grid" style={{ marginBottom: 20 }}>
        <div className="card">
          <div className="card-header"><span className="card-title">Triage Distribution</span><span className="badge badge-live">ALL CASES</span></div>
          <div style={{ padding: '20px 18px', display: 'flex', alignItems: 'center', gap: 24 }}>
            {pieData.length > 0 ? (
              <>
                <ResponsiveContainer width={180} height={180}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                      {pieData.map(d => <Cell key={d.name} fill={TRIAGE_COLORS[d.name]} />)}
                    </Pie>
                    <Tooltip content={customTooltip} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {pieData.map(d => (
                    <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: TRIAGE_COLORS[d.name] }} />
                      <span style={{ fontSize: 11, color: 'var(--text2)', fontFamily: 'var(--mono)' }}>{d.name}</span>
                      <span style={{ fontSize: 11, fontWeight: 600, color: TRIAGE_COLORS[d.name], marginLeft: 'auto' }}>{d.value}</span>
                      <span style={{ fontSize: 10, color: 'var(--text3)' }}>{triage[d.name]?.pct ?? 0}%</span>
                    </div>
                  ))}
                </div>
              </>
            ) : <div style={{ color: 'var(--text3)', fontFamily: 'var(--mono)', fontSize: 12 }}>No data available</div>}
          </div>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">PWAT Score Distribution</span><span className="badge badge-ai">AI SCORED</span></div>
          <div style={{ padding: '16px 18px' }}>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={pwatBuckets} barSize={20}>
                <XAxis dataKey="range" tick={{ fill: 'rgba(240,244,255,0.35)', fontSize: 10, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip content={customTooltip} />
                <Bar dataKey="count" radius={[4,4,0,0]}>
                  {pwatBuckets.map((b,i) => <Cell key={i} fill={i >= 2 ? 'var(--red)' : i === 1 ? 'var(--amber)' : 'var(--green)'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="mid-grid">
        <div className="card">
          <div className="card-header"><span className="card-title">Sessions Over Time</span><span className="badge badge-cyan">TIMELINE</span></div>
          <div style={{ padding: '16px 18px' }}>
            {timeData.length > 0 ? (
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={timeData}>
                  <CartesianGrid stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="date" tick={{ fill: 'rgba(240,244,255,0.35)', fontSize: 9, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip content={customTooltip} />
                  <Line type="monotone" dataKey="count" stroke="var(--accent)" strokeWidth={2} dot={{ fill: 'var(--accent)', r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : <div style={{ color: 'var(--text3)', fontFamily: 'var(--mono)', fontSize: 12, padding: 20 }}>Not enough data for timeline.</div>}
          </div>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">Depth Severity Breakdown</span><span className="badge badge-warn">WOUND DEPTH</span></div>
          <div style={{ padding: '16px 18px' }}>
            {depthData.length > 0 ? (
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={depthData} layout="vertical" barSize={12}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" tick={{ fill: 'rgba(240,244,255,0.4)', fontSize: 10, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} width={80} />
                  <Tooltip content={customTooltip} />
                  <Bar dataKey="count" fill="var(--cyan)" radius={[0,4,4,0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <div style={{ color: 'var(--text3)', fontFamily: 'var(--mono)', fontSize: 12 }}>No data.</div>}
          </div>
        </div>
      </div>
    </>
  );
}
