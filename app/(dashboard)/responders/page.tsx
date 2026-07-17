'use client';
import { RESPONDERS } from '@/config/fleet';
import { useIncidents } from '@/hooks';
import { useNucleusStore } from '@/store/useNucleusStore';
import { getDeviceForResponder } from '@/lib/deviceAssignments';

const STATUS_CONFIG: Record<string, { cls: string; dot: string; label: string }> = {
  LIVE:    { cls: 'status-live',    dot: 'd-online',  label: 'LIVE' },
  ONLINE:  { cls: 'status-online',  dot: 'd-online',  label: 'ONLINE' },
  IDLE:    { cls: 'status-idle',    dot: 'd-idle',    label: 'IDLE' },
  OFFLINE: { cls: 'status-offline', dot: 'd-offline', label: 'OFFLINE' },
};

const usageColor = (pct: number) => pct >= 75 ? 'var(--green)' : pct >= 50 ? 'var(--amber)' : 'var(--red)';

export default function RespondersPage() {
  const { data: incidentsData } = useIncidents();
  const incidents = incidentsData?.incidents ?? [];
  const assignments = useNucleusStore((s) => s.deviceAssignments);

  const active  = RESPONDERS.filter(r => r.status === 'LIVE' || r.status === 'ONLINE').length;
  const idle    = RESPONDERS.filter(r => r.status === 'IDLE').length;
  const offline = RESPONDERS.filter(r => r.status === 'OFFLINE').length;

  const incidentsHandled = (name: string) => incidents.filter(i => i.responder === name).length;

  return (
    <>
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        {[{ label:'Active', value:active, color:'var(--green)' }, { label:'Idle', value:idle, color:'var(--amber)' }, { label:'Offline', value:offline, color:'var(--text3)' }, { label:'Total', value:RESPONDERS.length, color:'var(--text)' }].map(s => (
          <div key={s.label} style={{ flex:1, background:'var(--glass)', border:'1px solid var(--border)', borderRadius:'var(--r)', padding:'14px 18px', textAlign:'center' }}>
            <div style={{ fontSize:9, color:'var(--text3)', fontFamily:'var(--mono)', letterSpacing:2, textTransform:'uppercase', marginBottom:6 }}>{s.label}</div>
            <div style={{ fontSize:28, fontWeight:800, color:s.color, letterSpacing:-1 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ background:'rgba(59,130,246,0.04)', border:'1px solid rgba(59,130,246,0.15)', borderRadius:10, padding:'10px 16px', marginBottom:20, fontSize:11, color:'var(--text3)', fontFamily:'var(--mono)' }}>
        ℹ Rank, unit, and Valkyra usage rate are managed via fleet configuration. Incidents handled is computed live from the incident feed.
      </div>

      <div className="section-hd"><div className="section-title">Field Responders · {RESPONDERS.length} Personnel</div></div>
      <div className="responder-grid">
        {RESPONDERS.map(r => {
          const sc = STATUS_CONFIG[r.status];
          const handled = incidentsHandled(r.name);
          const device = getDeviceForResponder(r.id, assignments);
          return (
            <div key={r.id} className="responder-card">
              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:12 }}>
                <div className="resp-avatar">{r.initials}</div>
                <span className={`badge ${sc.cls}`} style={{ padding:'4px 10px' }}>{sc.label}</span>
              </div>
              <div className="resp-name">{r.name}</div>
              <div className="resp-rank">{r.rank} · {r.unit}</div>

              <div style={{ marginTop:12, paddingTop:12, borderTop:'1px solid var(--border)' }}>
                <div style={{ fontSize:9, color:'var(--text3)', fontFamily:'var(--mono)', letterSpacing:2, marginBottom:6, textTransform:'uppercase' }}>Assigned Device</div>
                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <div className={`d-status ${sc.dot}`} />
                  <span style={{ fontSize:11, fontFamily:'var(--mono)', color:'var(--text2)' }}>{device ? `${device.model} ${device.serial}` : 'Unassigned'}</span>
                </div>
              </div>

              <div style={{ marginTop:12, paddingTop:12, borderTop:'1px solid var(--border)' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:4 }}>
                  <span style={{ fontSize:9, color:'var(--text3)', fontFamily:'var(--mono)', letterSpacing:2, textTransform:'uppercase' }}>Valkyra Usage</span>
                  <span style={{ fontSize:11, fontFamily:'var(--mono)', fontWeight:700, color:usageColor(r.valkyra_usage_pct) }}>{r.valkyra_usage_pct}%</span>
                </div>
                <div className="acc-track"><div className="acc-fill" style={{ width:`${r.valkyra_usage_pct}%`, background:usageColor(r.valkyra_usage_pct) }} /></div>
              </div>

              <div style={{ marginTop:12, paddingTop:12, borderTop:'1px solid var(--border)', display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
                <div>
                  <div style={{ fontSize:8, color:'var(--text3)', fontFamily:'var(--mono)', letterSpacing:1, textTransform:'uppercase', marginBottom:3 }}>Incidents</div>
                  <div style={{ fontSize:15, fontWeight:700, color:'var(--text)' }}>{handled}</div>
                </div>
                <div>
                  <div style={{ fontSize:8, color:'var(--text3)', fontFamily:'var(--mono)', letterSpacing:1, textTransform:'uppercase', marginBottom:3 }}>Avg Response</div>
                  <div style={{ fontSize:15, fontWeight:700, color:'var(--text)' }}>{r.avg_response_min}<span style={{ fontSize:10, color:'var(--text3)', fontWeight:400 }}>m</span></div>
                </div>
                <div>
                  <div style={{ fontSize:8, color:'var(--text3)', fontFamily:'var(--mono)', letterSpacing:1, textTransform:'uppercase', marginBottom:3 }}>Resolved</div>
                  <div style={{ fontSize:15, fontWeight:700, color:'var(--green)' }}>{r.resolution_rate_pct}<span style={{ fontSize:10, color:'var(--text3)', fontWeight:400 }}>%</span></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
