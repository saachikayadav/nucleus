'use client';
import { useSummary, useAllSessions } from '@/hooks';
import { useNucleusStore } from '@/store/useNucleusStore';
import { pwatColor, triageClass, depthSeverityColor, formatDate, formatTime } from '@/lib/utils';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useState, useEffect } from 'react';

// --- 1. HUD Number Ticker Component ---
function AnimatedNumber({ value, decimals = 0 }: { value: any, decimals?: number }) {
  const count = useMotionValue(0);
  const formatted = useTransform(count, (latest) => latest.toFixed(decimals));

  useEffect(() => {
    if (value !== '—' && !isNaN(Number(value))) {
      const controls = animate(count, Number(value), { duration: 1.5, ease: "easeOut" });
      return controls.stop;
    }
  }, [value, count]);

  if (value === '—') return <span>—</span>;
  return <motion.span>{formatted}</motion.span>;
}

// --- Valkyra Nucleus Animation Variants ---
const staggerReveal = {
  hidden: { opacity: 0, y: 12 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.4, ease: "easeOut" },
  }),
};

// --- 2. Live Radar Scanline Component ---
function ScannerSweep() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-lg opacity-[0.15]">
      <motion.div
        className="w-full h-[1px] bg-gradient-to-r from-transparent via-[#22d3ee] to-transparent shadow-[0_0_8px_rgba(34,211,238,0.8)]"
        animate={{ y: ["-100%", "600%"] }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear", delay: Math.random() * 2 }}
      />
    </div>
  );
}

function MetricCard({ label, value, sub, color, bg, decimals = 0 }: any) {
  return (
    <div className={`metric-card ${bg} relative transition-all duration-200 hover:-translate-y-[2px] hover:shadow-[inset_0_0_20px_rgba(255,255,255,0.02)] overflow-hidden`}>
      <ScannerSweep />
      <div className="metric-label relative z-10">{label}</div>
      <div className={`metric-value ${color} relative z-10`}>
        <AnimatedNumber value={value} decimals={decimals} />
      </div>
      <div className="metric-delta relative z-10" dangerouslySetInnerHTML={{ __html: sub }} />
    </div>
  );
}

export default function OverviewPage() {
  const { data: summary, isLoading: sumLoading } = useSummary();
  const { data: sessionsData, isLoading: sessLoading } = useAllSessions();
  const setActivePatientId = useNucleusStore((s) => s.setActivePatientId);
  const triageFilter = useNucleusStore((s) => s.triageFilter);
  const setTriageFilter = useNucleusStore((s) => s.setTriageFilter);
  
  const [showAllSessions, setShowAllSessions] = useState(false);

  const sessions = sessionsData?.sessions ?? [];
  const filtered = triageFilter === 'all' ? sessions : sessions.filter(s => s.triage_category === triageFilter);
  const critical = sessions.filter(s => s.triage_category === 'Red' || s.triage_category === 'Orange');
  const displaySessions = showAllSessions ? filtered : filtered.slice(0, 5);

  const triage = summary?.triage_distribution ?? {} as any;
  const totalCases = summary?.total_cases ?? 0;
  const avgPwat = summary?.pwat_stats?.average ?? summary?.avg_pwat ?? 0;
  const minPwat = summary?.pwat_stats?.minimum ?? 0;
  const maxPwat = summary?.pwat_stats?.maximum ?? 0;
  const redCount = triage.Red?.count ?? 0;

  let animationIndex = 0;

  return (
    <>
      {redCount > 0 && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="notif-banner error flex items-center gap-3" 
          style={{ marginBottom: 20 }}
        >
          {/* --- 3. Heartbeat Pulse --- */}
          <motion.div 
            className="w-2.5 h-2.5 rounded-full" 
            style={{ background: 'var(--red)' }}
            animate={{ 
              boxShadow: [
                "0 0 0px 0px rgba(248, 113, 113, 0.8)", 
                "0 0 15px 5px rgba(248, 113, 113, 0)", 
                "0 0 0px 0px rgba(248, 113, 113, 0)"
              ] 
            }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          />
          <div className="notif-text"><strong>{redCount} critical case{redCount > 1 ? 's' : ''}</strong> requiring immediate attention</div>
        </motion.div>
      )}

      <div className="section-hd">
        <div className="section-title">Live Wound Intelligence · Hospital API</div>
        <span className="see-all">Live ›</span>
      </div>

      <div className="metrics-grid">
        <motion.div custom={++animationIndex} initial="hidden" animate="show" variants={staggerReveal}>
          <MetricCard label="Total Cases" value={sumLoading ? '—' : totalCases} sub='<span style="color:var(--text3)">All sessions recorded</span>' color="cv-blue" bg="mc-blue" />
        </motion.div>
        <motion.div custom={++animationIndex} initial="hidden" animate="show" variants={staggerReveal}>
          <MetricCard label="Avg PWAT Score" value={sumLoading ? '—' : avgPwat} decimals={2} sub={`<span style="color:var(--text3)">Min ${minPwat} · Max ${maxPwat}</span>`} color="cv-amber" bg="mc-amber" />
        </motion.div>
        <motion.div custom={++animationIndex} initial="hidden" animate="show" variants={staggerReveal}>
          <MetricCard label="Critical (Red)" value={sumLoading ? '—' : redCount} sub={redCount > 0 ? '<span class="delta-down">⚠ Immediate attention required</span>' : '<span class="delta-up">No critical cases</span>'} color="cv-red" bg="mc-red" />
        </motion.div>
        <motion.div custom={++animationIndex} initial="hidden" animate="show" variants={staggerReveal}>
          <MetricCard label="Max PWAT Score" value={sumLoading ? '—' : maxPwat} sub='<span style="color:var(--text3)">Highest severity recorded</span>' color="cv-cyan" bg="mc-cyan" />
        </motion.div>
      </div>

      <div className="mid-grid">
        <motion.div custom={++animationIndex} initial="hidden" animate="show" variants={staggerReveal} className="card relative overflow-hidden">
          <ScannerSweep />
          <div className="card-header relative z-10">
            <span className="card-title">Triage Distribution · All Cases</span>
            <span className="badge badge-live"><AnimatedNumber value={totalCases} /> CASES</span>
          </div>
          <div className="chart-area relative z-10">
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
                    <motion.div key={key} initial={{ opacity: 0, width: "80%" }} animate={{ opacity: 1, width: "100%" }} transition={{ duration: 0.5 }} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ fontSize: 10, color: 'var(--text2)', width: 80, fontFamily: 'var(--mono)' }}>{key}</div>
                      <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${item.pct}%`, background: colors[key], borderRadius: 2, position: 'relative', overflow: 'hidden' }}>
                          {/* --- 4. Energy Flow Progress Bar --- */}
                          <motion.div 
                            className="absolute top-0 bottom-0 left-0 w-1/2 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                            animate={{ x: ["-100%", "300%"] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear", delay: Math.random() }}
                          />
                        </div>
                      </div>
                      <div style={{ fontSize: 11, color: colors[key], width: 32, textAlign: 'right' }}><AnimatedNumber value={item.count} /></div>
                      <div style={{ fontSize: 10, color: 'var(--text3)', width: 36 }}>{item.pct}%</div>
                    </motion.div>
                  );
                })}
              </div>
            )}
            {!sumLoading && summary && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="improvement-banner" style={{ marginTop: 14 }}>
                <div>
                  <div className="imp-main">
                    {Object.entries(triage).sort(([,a]: any,[,b]: any) => b.count - a.count)[0]?.[0]} is most frequent
                  </div>
                  <div className="imp-sub">PWAT range analysis</div>
                </div>
                <div className="imp-right">
                  {(Object.values(triage) as any[]).sort((a,b) => b.count - a.count)[0]?.pct ?? 0}%
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>

        <motion.div custom={++animationIndex} initial="hidden" animate="show" variants={staggerReveal} className="card relative overflow-hidden">
          <ScannerSweep />
          <div className="card-header relative z-10">
            <span className="card-title">PWAT Score Breakdown</span>
            <span className="badge badge-ai">AI SCORED</span>
          </div>
          <div className="injury-list relative z-10">
            {sessLoading ? (
              <div className="skeleton" style={{ height: 12, width: '100%' }} />
            ) : sessions.filter(s => s.pwat_score > 0).slice(0, 6).map((s, idx) => {
              const pct = Math.round((s.pwat_score / 20) * 100);
              const col = pwatColor(s.pwat_score);
              const shortId = s.session_id.length > 18 ? s.session_id.slice(0,18)+'…' : s.session_id;
              return (
                <motion.div 
                  key={s.session_id} 
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.1 }}
                  className="injury-row hover:bg-white/5 transition-colors" style={{ cursor: 'pointer' }} onClick={() => setActivePatientId(s.session_id)}
                >
                  <div className="inj-type" title={s.session_id}>{shortId}</div>
                  <div className="inj-track">
                    <div className="inj-fill" style={{ width: `${pct}%`, background: col, boxShadow: `0 0 8px ${col}`, position: 'relative', overflow: 'hidden' }}>
                       {/* Energy Flow */}
                       <motion.div className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-transparent via-white/30 to-transparent" animate={{ x: ["-100%", "300%"] }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear", delay: idx * 0.2 }} />
                    </div>
                  </div>
                  <div className="inj-count" style={{ color: col }}>{s.pwat_score}</div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>

      <div className="section-hd">
        <div className="section-title">Recent Sessions · Click to view full record</div>
        <span className="see-all cursor-pointer transition-colors hover:text-white" onClick={() => setShowAllSessions(!showAllSessions)}>
          {showAllSessions ? 'Less ›' : 'All ›'}
        </span>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        {(['all','Red','Orange','Yellow','Green'] as const).map(f => (
          <button key={f} className="btn transition-colors duration-200" style={{ fontSize: 11, padding: '5px 12px', ...(triageFilter === f ? { borderColor: 'rgba(59,130,246,0.5)', color: '#93c5fd', backgroundColor: 'rgba(59,130,246,0.12)' } : {}) }}
            onClick={() => { setTriageFilter(f); setShowAllSessions(false); }}>
            {f === 'all' ? 'All' : `${f === 'Red' ? '🔴' : f === 'Orange' ? '🟠' : f === 'Yellow' ? '🟡' : '🟢'} ${f}`}
          </button>
        ))}
      </div>

      <motion.div custom={++animationIndex} initial="hidden" animate="show" variants={staggerReveal} className="card relative overflow-hidden" style={{ marginBottom: 20 }}>
        <ScannerSweep />
        <div className="card-header relative z-10">
          <span className="card-title">Patient Sessions</span>
          <span className="badge badge-live"><AnimatedNumber value={filtered.length} /> SESSIONS</span>
        </div>
        <div className="relative z-10">
          {sessLoading ? (
            <div style={{ padding: '16px 18px' }}>
              <div className="skeleton" style={{ height: 14, width: '100%', marginBottom: 10 }} />
              <div className="skeleton" style={{ height: 14, width: '85%' }} />
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '16px 18px', fontSize: 12, color: 'var(--text3)', fontFamily: 'var(--mono)' }}>No sessions found.</div>
          ) : displaySessions.map((s, i) => { 
            const wm = s.wound_metrics ?? {} as any;
            const depthSev = wm.depth_severity || '—';
            const areaPct = wm.area_pct != null ? Number(wm.area_pct).toFixed(1) + '%' : '—';
            return (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                key={s.session_id} className="feed-item hover:bg-white/5 transition-colors cursor-pointer" onClick={() => setActivePatientId(s.session_id)}
              >
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
                <div className="feed-outcome flex items-center gap-2">
                  <motion.div 
                    className={`w-1.5 h-1.5 rounded-full ${s.triage_category === 'Red' ? 'bg-red-500' : 'bg-green-500'}`}
                    animate={s.triage_category === 'Red' ? { boxShadow: ["0 0 0px 0px rgba(248,113,113,0.8)", "0 0 10px 3px rgba(248,113,113,0)", "0 0 0px 0px rgba(248,113,113,0)"] } : {}}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                  {s.triage_category === 'Red' ? 'Critical — immediate' : 'Recorded — click to view'}
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      <div className="section-hd">
        <div className="section-title">Active Systems</div>
      </div>
      <div className="bottom-grid">
        <motion.div custom={++animationIndex} initial="hidden" animate="show" variants={staggerReveal} className="card relative overflow-hidden">
          <ScannerSweep />
          <div className="card-header relative z-10">
            <span className="card-title">AR Device Fleet</span>
            <span style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--text3)' }}>24 / 31 ONLINE</span>
          </div>
          <div className="relative z-10">
            {[
              { name: 'XREAL Air 2 Ultra · #07', user: 'SGT. M. Torres · Unit 4', status: 'd-online', time: 'LIVE', live: true },
              { name: 'XREAL One Pro · #14',     user: 'CPL. A. Chen · Unit 2',   status: 'd-online', time: 'LIVE', live: true },
              { name: 'XREAL Air 2 Ultra · #03', user: 'PFC. D. Reyes · Unit 1',  status: 'd-online', time: '2m ago', live: false },
              { name: 'XREAL One Pro · #22',     user: 'SGT. L. Park · Unit 6',   status: 'd-idle',   time: 'IDLE', live: false },
              { name: 'XREAL Air 2 Ultra · #11', user: 'CPL. R. James · Unit 3',  status: 'd-offline',time: 'OFFLINE', live: false },
            ].map((d, i) => (
              <motion.div key={d.name} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 + (i * 0.1) }} className="device-row hover:bg-white/5 transition-colors">
                <div className={`d-status ${d.status}`} />
                <div className="d-info"><div className="d-name">{d.name}</div><div className="d-user">{d.user}</div></div>
                <div className={`d-time${d.live ? ' live' : ''}`} style={d.status === 'd-idle' ? { color: 'var(--amber)' } : {}}>{d.time}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div custom={++animationIndex} initial="hidden" animate="show" variants={staggerReveal} className="card relative overflow-hidden">
          <ScannerSweep />
          <div className="card-header relative z-10">
            <span className="card-title">Critical Cases Feed</span>
            <span className="badge badge-red">RED TRIAGE</span>
          </div>
          <div className="relative z-10">
            {critical.length === 0 ? (
              <div style={{ padding: '14px 18px', fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--mono)' }}>No critical cases.</div>
            ) : critical.slice(0, 4).map((s, i) => (
              <motion.div 
                key={s.session_id} 
                initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + (i * 0.1) }}
                className="feed-item hover:bg-white/5 transition-colors cursor-pointer" 
                onClick={() => setActivePatientId(s.session_id)}
              >
                <div className="feed-meta">
                  <span className={`feed-type ${triageClass(s.triage_category)}`}>{s.triage_category}</span>
                  <span className="feed-time">{formatTime(s.created_at)}</span>
                </div>
                <div className="feed-desc">PWAT {s.pwat_score} · {s.source_image || 'Unknown source'}</div>
                <div className="feed-outcome flex items-center gap-2">
                  <motion.div 
                    className="w-1.5 h-1.5 rounded-full bg-red-500"
                    animate={{ boxShadow: ["0 0 0px 0px rgba(248,113,113,0.8)", "0 0 10px 3px rgba(248,113,113,0)", "0 0 0px 0px rgba(248,113,113,0)"] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  /> 
                  Requires immediate attention
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div custom={++animationIndex} initial="hidden" animate="show" variants={staggerReveal} className="card relative overflow-hidden">
          <ScannerSweep />
          <div className="card-header relative z-10">
            <span className="card-title">AI Recommendation Accuracy</span>
            <span className="badge badge-ai">MODEL v3.1</span>
          </div>
          <div className="acc-area relative z-10">
            <div className="big-num"><AnimatedNumber value={94.7} decimals={1} />%</div>
            <div className="acc-sub">Validated by licensed MDs this month</div>
            <div className="acc-rows">
              {[['GSW',97,'#93c5fd'],['Stab',95,'#93c5fd'],['Blunt',93,'var(--amber)'],['Burn',91,'var(--amber)']].map(([l,v,c], i) => (
                <motion.div key={l as string} initial={{ opacity: 0, width: "80%" }} animate={{ opacity: 1, width: "100%" }} transition={{ delay: 0.3 + (i * 0.1) }} className="acc-row">
                  <div className="acc-label">{l}</div>
                  <div className="acc-track">
                    <div className="acc-fill" style={{ width: `${v}%`, background: c as string, position: 'relative', overflow: 'hidden' }}>
                      {/* Energy Flow */}
                      <motion.div className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-transparent via-white/30 to-transparent" animate={{ x: ["-100%", "300%"] }} transition={{ duration: 1.8, repeat: Infinity, ease: "linear", delay: i * 0.3 }} />
                    </div>
                  </div>
                  <div className="acc-pct"><AnimatedNumber value={v} />%</div>
                </motion.div>
              ))}
            </div>
            <div className="esc-row">
              <div><div className="esc-label">Escalation Rate</div><div className="esc-val"><AnimatedNumber value={12.3} decimals={1} />% <span>of cases</span></div></div>
              <div style={{ textAlign: 'right' }}><div className="esc-label">Doctor Calls</div><div className="esc-val" style={{ color: '#93c5fd' }}><AnimatedNumber value={18} /> <span>this month</span></div></div>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
}