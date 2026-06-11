'use client';
import { RESPONDERS } from '@/config/fleet';

const STATUS_CONFIG: Record<string, { cls: string; dot: string; label: string }> = {
  LIVE:    { cls: 'status-live',    dot: 'd-online',  label: 'LIVE' },
  ONLINE:  { cls: 'status-online',  dot: 'd-online',  label: 'ONLINE' },
  IDLE:    { cls: 'status-idle',    dot: 'd-idle',    label: 'IDLE' },
  OFFLINE: { cls: 'status-offline', dot: 'd-offline', label: 'OFFLINE' },
};

export default function RespondersPage() {
  const active  = RESPONDERS.filter(r => r.status === 'LIVE' || r.status === 'ONLINE').length;
  const idle    = RESPONDERS.filter(r => r.status === 'IDLE').length;
  const offline = RESPONDERS.filter(r => r.status === 'OFFLINE').length;

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
        ℹ Responder data is managed via fleet configuration. Connect a Responders API to enable live sync.
      </div>

      <div className="section-hd"><div className="section-title">Field Responders · {RESPONDERS.length} Personnel</div></div>
      <div className="responder-grid">
        {RESPONDERS.map(r => {
          const sc = STATUS_CONFIG[r.status];
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
                  <span style={{ fontSize:11, fontFamily:'var(--mono)', color:'var(--text2)' }}>{r.device_id}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
