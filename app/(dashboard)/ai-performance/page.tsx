'use client';
import { useSummary, useAllSessions } from '@/hooks';
import { bucketPwat, pwatColor } from '@/lib/utils';
import { BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie } from 'recharts';

const TRIAGE_COLORS: Record<string,string> = { Red:'#f87171', Orange:'#fbbf24', Yellow:'#fde047', Green:'#4ade80' };

export default function AIPerformancePage() {
  const { data: summary, isLoading: sl } = useSummary();
  const { data: sd } = useAllSessions();
  const sessions = sd?.sessions ?? [];
  const triage = summary?.triage_distribution ?? {} as any;
  const total = summary?.total_cases ?? 0;
  const avg = summary?.avg_pwat ?? 0;
  const pwatBuckets = bucketPwat(sessions);
  const pieData = ['Red','Orange','Yellow','Green'].map(k => ({ name:k, value:triage[k]?.count??0 })).filter(d=>d.value>0);

  const customTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{ background:'rgba(6,12,24,0.95)', border:'1px solid var(--border-hi)', borderRadius:8, padding:'6px 12px', fontFamily:'var(--mono)', fontSize:11 }}>
        <div style={{ color:'var(--text)' }}>{payload[0]?.name??''}: <strong style={{ color:'var(--accent)' }}>{payload[0]?.value}</strong></div>
      </div>
    );
  };

  return (
    <>
      <div style={{ background:'rgba(192,132,252,0.04)', border:'1px solid rgba(192,132,252,0.15)', borderRadius:10, padding:'10px 16px', marginBottom:20, fontSize:11, color:'var(--text3)', fontFamily:'var(--mono)' }}>
        ℹ Sections marked "STATIC BENCHMARK" are from the MD validation dataset, not computed from live sessions.
      </div>

      <div className="section-hd"><div className="section-title">Live Stats · Computed from real sessions</div></div>
      <div className="metrics-grid" style={{ marginBottom:20 }}>
        <div className="metric-card mc-blue"><div className="metric-label">Model Version</div><div className="metric-value cv-blue" style={{ fontSize:22 }}>v3.1</div></div>
        <div className="metric-card mc-amber"><div className="metric-label">AI-Scored Sessions</div><div className="metric-value cv-amber">{sl?'—':total}</div></div>
        <div className="metric-card mc-cyan"><div className="metric-label">Avg PWAT Assigned</div><div className="metric-value cv-cyan">{sl?'—':Number(avg).toFixed(2)}</div></div>
        <div className="metric-card mc-red"><div className="metric-label">Critical Detections</div><div className="metric-value cv-red">{sl?'—':triage.Red?.count??0}<span style={{fontSize:12,color:'var(--text3)',fontWeight:400}}> Red</span></div></div>
      </div>

      <div className="mid-grid" style={{ marginBottom:20 }}>
        <div className="card">
          <div className="card-header"><span className="card-title">PWAT Score Distribution</span><span className="badge badge-live">LIVE DATA</span></div>
          <div style={{ padding:'16px 18px' }}>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={pwatBuckets} barSize={24}>
                <XAxis dataKey="range" tick={{ fill:'rgba(240,244,255,0.35)', fontSize:10, fontFamily:'JetBrains Mono' }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip content={customTooltip} />
                <Bar dataKey="count" radius={[4,4,0,0]}>
                  {pwatBuckets.map((b,i) => <Cell key={i} fill={i>=2?'var(--red)':i===1?'var(--amber)':'var(--green)'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card">
          <div className="card-header"><span className="card-title">Triage Distribution</span><span className="badge badge-live">LIVE DATA</span></div>
          <div style={{ padding:'20px 18px', display:'flex', alignItems:'center', gap:20 }}>
            {pieData.length > 0 ? (
              <>
                <ResponsiveContainer width={140} height={140}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={38} outerRadius={62} dataKey="value" paddingAngle={3}>
                      {pieData.map(d=><Cell key={d.name} fill={TRIAGE_COLORS[d.name]} />)}
                    </Pie>
                    <Tooltip content={customTooltip} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ flex:1 }}>
                  {pieData.map(d=>(
                    <div key={d.name} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                      <div style={{ width:6, height:6, borderRadius:'50%', background:TRIAGE_COLORS[d.name] }} />
                      <span style={{ fontSize:10, color:'var(--text2)', fontFamily:'var(--mono)', flex:1 }}>{d.name}</span>
                      <span style={{ fontSize:11, fontWeight:600, color:TRIAGE_COLORS[d.name] }}>{d.value}</span>
                      <span style={{ fontSize:10, color:'var(--text3)' }}>{triage[d.name]?.pct??0}%</span>
                    </div>
                  ))}
                </div>
              </>
            ) : <div style={{ color:'var(--text3)', fontFamily:'var(--mono)', fontSize:12 }}>No data</div>}
          </div>
        </div>
      </div>

      <div className="section-hd"><div className="section-title">Benchmark Stats · Static MD Validation Dataset</div><span className="badge badge-ai">STATIC BENCHMARK</span></div>
      <div className="card">
        <div className="card-header">
          <span className="card-title">AI Recommendation Accuracy · Model v3.1</span>
          <span style={{ fontSize:9, color:'var(--text3)', fontFamily:'var(--mono)', letterSpacing:1 }}>MD VALIDATED · NOT COMPUTED LIVE</span>
        </div>
        <div className="acc-area">
          <div style={{ display:'flex', alignItems:'flex-end', gap:16, marginBottom:16 }}>
            <div><div className="big-num">94.7%</div><div className="acc-sub">Validated by licensed MDs · Static benchmark</div></div>
            <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
              <div style={{ fontSize:11, color:'var(--green)', fontFamily:'var(--mono)' }}>↑ +2.1% vs Model v3.0</div>
              <div style={{ fontSize:10, color:'var(--text3)', fontFamily:'var(--mono)' }}>Escalation Rate: 12.3%</div>
            </div>
          </div>
          <div className="acc-rows">
            {[['GSW',97,'#93c5fd'],['Stab',95,'#93c5fd'],['Blunt',93,'var(--amber)'],['Burn',91,'var(--amber)']].map(([l,v,c]) => (
              <div key={l as string} className="acc-row">
                <div className="acc-label">{l}</div>
                <div className="acc-track"><div className="acc-fill" style={{ width:`${v}%`, background:c as string }} /></div>
                <div className="acc-pct">{v}%</div>
              </div>
            ))}
          </div>
          <div className="esc-row">
            <div><div className="esc-label">Doctor Calls (Static)</div><div className="esc-val" style={{ color:'#93c5fd' }}>18 <span>this month</span></div></div>
            <div style={{ textAlign:'right' }}><div className="esc-label">Source</div><div style={{ fontSize:10, color:'var(--text3)', fontFamily:'var(--mono)', marginTop:2 }}>MD validation dataset</div></div>
          </div>
        </div>
      </div>
    </>
  );
}
