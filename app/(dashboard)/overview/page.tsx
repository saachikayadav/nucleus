'use client';
import { useSummary, useAllSessions } from '@/hooks';
import { useNucleusStore } from '@/store/useNucleusStore';
import { pwatColor, triageClass, depthSeverityColor, formatDate, formatTime } from '@/lib/utils';

function MetricCard({ label, value, sub, color, bg }: any) {
  return (
    <div className={`metric-card ${bg}`}>
      <div className="metric-label">{label}</div>
      <div className={`metric-value ${color}`}>{value}</div>
      <div className="metric-delta" dangerouslySetInnerHTML={{ __html: sub }} />
    </div>
  );
}

export default function OverviewPage() {
  const { data: summary, isLoading: sumLoading } = useSummary();
  const { data: sessionsData, isLoading: sessLoading } = useAllSessions();
  const setActivePatientId = useNucleusStore((s) => s.setActivePatientId);
  const triageFilter = useNucleusStore((s) => s.triageFilter);
  const setTriageFilter = useNucleusStore((s) => s.setTriageFilter);

  const sessions = sessionsData?.sessions ?? [];
  const filtered = triageFilter === 'all' ? sessions : sessions.filter(s => s.triage_category === triageFilter);
  const critical = sessions.filter(s => s.triage_category === 'Red' || s.triage_category === 'Orange');

  const triage = summary?.triage_distribution ?? {} as any;
  const totalCases = summary?.total_cases ?? 0;
  const avgPwat = summary?.pwat_stats?.average ?? summary?.avg_pwat ?? 0;
  const minPwat = summary?.pwat_stats?.minimum ?? 0;
  const maxPwat = summary?.pwat_stats?.maximum ?? 0;
  const redCount = triage.Red?.count ?? 0;

  return (
    <>
      {redCount > 0 && (
        <div className="notif-banner error" style={{ marginBottom: 20 }}>
          <div className="notif-dot" style={{ background: 'var(--red)' }} />
          <div className="notif-text"><strong>{redCount} critical case{redCount > 1 ? 's' : ''}</strong> requiring immediate attention</div>
        </div>
      )}

      <div className="section-hd">
        <div className="section-title">Live Wound Intelligence · Hospital API</div>
        <span className="see-all">Live ›</span>
      </div>

      <div className="metrics-grid">
        <MetricCard label="Total Cases" value={sumLoading ? '—' : totalCases} sub='<span style="color:var(--text3)">All sessions recorded</span>' color="cv-blue" bg="mc-blue" />
        <MetricCard label="Avg PWAT Score" value={sumLoading ? '—' : Number(avgPwat).toFixed(2)} sub={`<span style="color:var(--text3)">Min ${minPwat} · Max ${maxPwat}</span>`} color="cv-amber" bg="mc-amber" />
        <MetricCard label="Critical (Red)" value={sumLoading ? '—' : redCount}
          sub={redCount > 0 ? '<span class="delta-down">⚠ Immediate attention required</span>' : '<span class="delta-up">No critical cases</span>'}
          color="cv-red" bg="mc-red" />
        <MetricCard label="Max PWAT Score" value={sumLoading ? '—' : maxPwat} sub='<span style="color:var(--text3)">Highest severity recorded</span>' color="cv-cyan" bg="mc-cyan" />
      </div>

      <div className="mid-grid">
        <div className="card">
          <div className="card-header">
            <span className="card-title">Triage Distribution · All Cases</span>
            <span className="badge badge-live">{totalCases} CASES</span>
          </div>
          <div className="chart-area">
            {sumLoading ? (
              <>
                <div className="skeleton" style={{ height: 12, width: '100%', marginBottom: 10 }} />
                <div className="skeleton" style={{ height: 12, width: '85%' }} />
              </>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {(['Red','Orange','Yellow','Green'] as const).map(key => {
                  const item = triage[key];
                  if (!item?.count) return null;
                  const colors: Record<string,string> = { Red:'var(--red)', Orange:'var(--amber)', Yellow:'#fde047', Green:'var(--green)' };
                  return (
                    <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ fontSize: 10, color: 'var(--text2)', width: 80, fontFamily: 'var(--mono)' }}>{key}</div>
                      <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${item.pct}%`, background: colors[key], borderRadius: 2 }} />
                      </div>
                      <div style={{ fontSize: 11, color: colors[key], width: 32, textAlign: 'right' }}>{item.count}</div>
                      <div style={{ fontSize: 10, color: 'var(--text3)', width: 36 }}>{item.pct}%</div>
                    </div>
                  );
                })}
              </div>
            )}
            {!sumLoading && summary && (
              <div className="improvement-banner" style={{ marginTop: 14 }}>
                <div>
                  <div className="imp-main">
                    {Object.entries(triage).sort(([,a]: any,[,b]: any) => b.count - a.count)[0]?.[0]} is most frequent
                  </div>
                  <div className="imp-sub">PWAT range analysis</div>
                </div>
                <div className="imp-right">
                  {(Object.values(triage) as any[]).sort((a,b) => b.count - a.count)[0]?.pct ?? 0}%
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">PWAT Score Breakdown</span>
            <span className="badge badge-ai">AI SCORED</span>
          </div>
          <div className="injury-list">
            {sessLoading ? (
              <div className="skeleton" style={{ height: 12, width: '100%' }} />
            ) : sessions.filter(s => s.pwat_score > 0).slice(0, 6).map(s => {
              const pct = Math.round((s.pwat_score / 20) * 100);
              const col = pwatColor(s.pwat_score);
              const shortId = s.session_id.length > 18 ? s.session_id.slice(0,18)+'…' : s.session_id;
              return (
                <div key={s.session_id} className="injury-row" style={{ cursor: 'pointer' }} onClick={() => setActivePatientId(s.session_id)}>
                  <div className="inj-type" title={s.session_id}>{shortId}</div>
                  <div className="inj-track"><div className="inj-fill" style={{ width: `${pct}%`, background: col, boxShadow: `0 0 8px ${col}` }} /></div>
                  <div className="inj-count" style={{ color: col }}>{s.pwat_score}</div>
                </div>
              );
            })}
            <div className="training-callout">
              <div className="training-label">PWAT Scale</div>
              <div className="training-text">0–4 Minor · 4–8 Delayed · 8–12 Urgent · 12–20 Critical</div>
            </div>
          </div>
        </div>
      </div>

      <div className="section-hd">
        <div className="section-title">Recent Sessions · Click to view full record</div>
        <span className="see-all" onClick={() => setTriageFilter('all')}>All ›</span>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        {(['all','Red','Orange','Yellow','Green'] as const).map(f => (
          <button key={f} className="btn" style={{ fontSize: 11, padding: '5px 12px', ...(triageFilter === f ? { borderColor: 'rgba(59,130,246,0.5)', color: '#93c5fd' } : {}) }}
            onClick={() => setTriageFilter(f)}>
            {f === 'all' ? 'All' : `${f === 'Red' ? '🔴' : f === 'Orange' ? '🟠' : f === 'Yellow' ? '🟡' : '🟢'} ${f}`}
          </button>
        ))}
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <span className="card-title">Patient Sessions</span>
          <span className="badge badge-live">{filtered.length} SESSIONS</span>
        </div>
        <div>
          {sessLoading ? (
            <div style={{ padding: '16px 18px' }}>
              <div className="skeleton" style={{ height: 14, width: '100%', marginBottom: 10 }} />
              <div className="skeleton" style={{ height: 14, width: '85%' }} />
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '16px 18px', fontSize: 12, color: 'var(--text3)', fontFamily: 'var(--mono)' }}>No sessions found.</div>
          ) : filtered.map(s => {
            const wm = s.wound_metrics ?? {} as any;
            const depthSev = wm.depth_severity || '—';
            const areaPct = wm.area_pct != null ? Number(wm.area_pct).toFixed(1) + '%' : '—';
            return (
              <div key={s.session_id} className="feed-item" onClick={() => setActivePatientId(s.session_id)}>
                <div className="feed-meta">
                  <span className={`feed-type ${triageClass(s.triage_category)}`}>{s.triage_category}</span>
                  <span className="feed-time">{formatDate(s.created_at)}</span>
                </div>
                <div className="feed-desc" style={{ marginTop: 4 }}>
                  <strong style={{ color: 'var(--text)' }}>{s.session_id}</strong>
                  &nbsp;·&nbsp; PWAT <strong style={{ color: pwatColor(s.pwat_score) }}>{s.pwat_score}</strong>
                  &nbsp;·&nbsp; <span style={{ color: depthSeverityColor(depthSev) }}>{depthSev}</span>
                  &nbsp;·&nbsp; <span style={{ color: 'var(--text3)' }}>{areaPct} area</span>
                </div>
                <div className="feed-outcome">
                  <div className={`oc-dot ${s.triage_category === 'Red' ? 'oc-critical' : 'oc-stable'}`} />
                  {s.triage_category === 'Red' ? 'Critical — immediate' : 'Recorded — click to view'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="section-hd">
        <div className="section-title">Active Systems</div>
      </div>
      <div className="bottom-grid">
        <div className="card">
          <div className="card-header">
            <span className="card-title">AR Device Fleet</span>
            <span style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--text3)' }}>24 / 31 ONLINE</span>
          </div>
          <div>
            {[
              { name: 'XREAL Air 2 Ultra · #07', user: 'SGT. M. Torres · Unit 4', status: 'd-online', time: 'LIVE', live: true },
              { name: 'XREAL One Pro · #14',     user: 'CPL. A. Chen · Unit 2',   status: 'd-online', time: 'LIVE', live: true },
              { name: 'XREAL Air 2 Ultra · #03', user: 'PFC. D. Reyes · Unit 1',  status: 'd-online', time: '2m ago', live: false },
              { name: 'XREAL One Pro · #22',     user: 'SGT. L. Park · Unit 6',   status: 'd-idle',   time: 'IDLE', live: false },
              { name: 'XREAL Air 2 Ultra · #11', user: 'CPL. R. James · Unit 3',  status: 'd-offline',time: 'OFFLINE', live: false },
            ].map(d => (
              <div key={d.name} className="device-row">
                <div className={`d-status ${d.status}`} />
                <div className="d-info"><div className="d-name">{d.name}</div><div className="d-user">{d.user}</div></div>
                <div className={`d-time${d.live ? ' live' : ''}`} style={d.status === 'd-idle' ? { color: 'var(--amber)' } : {}}>{d.time}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Critical Cases Feed</span>
            <span className="badge badge-red">RED TRIAGE</span>
          </div>
          <div>
            {critical.length === 0 ? (
              <div style={{ padding: '14px 18px', fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--mono)' }}>No critical cases.</div>
            ) : critical.slice(0, 4).map(s => (
              <div key={s.session_id} className="feed-item" onClick={() => setActivePatientId(s.session_id)}>
                <div className="feed-meta">
                  <span className={`feed-type ${triageClass(s.triage_category)}`}>{s.triage_category}</span>
                  <span className="feed-time">{formatTime(s.created_at)}</span>
                </div>
                <div className="feed-desc">PWAT {s.pwat_score} · {s.source_image || 'Unknown source'}</div>
                <div className="feed-outcome"><div className="oc-dot oc-critical" /> Requires immediate attention</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">AI Recommendation Accuracy</span>
            <span className="badge badge-ai">MODEL v3.1</span>
          </div>
          <div className="acc-area">
            <div className="big-num">94.7%</div>
            <div className="acc-sub">Validated by licensed MDs this month</div>
            <div className="acc-rows">
              {[['GSW',97,'#93c5fd'],['Stab',95,'#93c5fd'],['Blunt',93,'var(--amber)'],['Burn',91,'var(--amber)']].map(([l,v,c]) => (
                <div key={l as string} className="acc-row">
                  <div className="acc-label">{l}</div>
                  <div className="acc-track"><div className="acc-fill" style={{ width: `${v}%`, background: c as string }} /></div>
                  <div className="acc-pct">{v}%</div>
                </div>
              ))}
            </div>
            <div className="esc-row">
              <div><div className="esc-label">Escalation Rate</div><div className="esc-val">12.3% <span>of cases</span></div></div>
              <div style={{ textAlign: 'right' }}><div className="esc-label">Doctor Calls</div><div className="esc-val" style={{ color: '#93c5fd' }}>18 <span>this month</span></div></div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
