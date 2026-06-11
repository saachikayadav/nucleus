'use client';
import { useState } from 'react';
import { DEVICES } from '@/config/fleet';

type FilterType = 'all' | 'LIVE' | 'ONLINE' | 'IDLE' | 'OFFLINE';

export default function DevicesPage() {
  const [filter, setFilter] = useState<FilterType>('all');

  const stats = { live: DEVICES.filter(d=>d.status==='LIVE').length, online: DEVICES.filter(d=>d.status==='ONLINE').length, idle: DEVICES.filter(d=>d.status==='IDLE').length, offline: DEVICES.filter(d=>d.status==='OFFLINE').length };
  const totalOnline = stats.live + stats.online;
  const total = DEVICES.length;

  const filtered = filter === 'all' ? DEVICES : DEVICES.filter(d => d.status === filter);

  const dotClass = (s: string) => s === 'LIVE' || s === 'ONLINE' ? 'd-online' : s === 'IDLE' ? 'd-idle' : 'd-offline';
  const timeClass = (s: string) => s === 'LIVE' || s === 'ONLINE' ? 'live' : '';
  const timeColor = (s: string) => s === 'IDLE' ? 'var(--amber)' : '';

  const onlinePct = Math.round((totalOnline / total) * 100);
  const r = 40, circ = 2 * Math.PI * r;

  return (
    <>
      <div style={{ display:'flex', gap:12, marginBottom:20 }}>
        <div style={{ flex:1, background:'var(--glass)', border:'1px solid var(--border)', borderRadius:'var(--r)', padding:'16px 18px', display:'flex', alignItems:'center', gap:20 }}>
          <svg width={100} height={100} viewBox="0 0 100 100">
            <circle cx={50} cy={50} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={10} />
            <circle cx={50} cy={50} r={r} fill="none" stroke="var(--green)" strokeWidth={10}
              strokeDasharray={circ} strokeDashoffset={circ * (1 - onlinePct/100)}
              strokeLinecap="round" transform="rotate(-90 50 50)" style={{ filter:'drop-shadow(0 0 6px var(--green))' }} />
            <text x={50} y={50} textAnchor="middle" dominantBaseline="middle" fill="#86efac" fontSize={18} fontWeight={700} fontFamily="Syne">{totalOnline}/{total}</text>
          </svg>
          <div>
            <div style={{ fontSize:9, color:'var(--text3)', fontFamily:'var(--mono)', letterSpacing:2, marginBottom:8, textTransform:'uppercase' }}>Fleet Health</div>
            <div style={{ fontSize:28, fontWeight:800, color:'var(--green)', letterSpacing:-1 }}>{onlinePct}%</div>
            <div style={{ fontSize:11, color:'var(--text3)', fontFamily:'var(--mono)' }}>Online · {totalOnline} of {total} devices</div>
          </div>
        </div>
        {[{label:'LIVE',value:stats.live,color:'var(--green)'},{label:'ONLINE',value:stats.online,color:'var(--cyan)'},{label:'IDLE',value:stats.idle,color:'var(--amber)'},{label:'OFFLINE',value:stats.offline,color:'var(--text3)'}].map(s => (
          <div key={s.label} style={{ flex:1, background:'var(--glass)', border:'1px solid var(--border)', borderRadius:'var(--r)', padding:'14px 18px', textAlign:'center' }}>
            <div style={{ fontSize:9, color:'var(--text3)', fontFamily:'var(--mono)', letterSpacing:2, marginBottom:6, textTransform:'uppercase' }}>{s.label}</div>
            <div style={{ fontSize:28, fontWeight:800, color:s.color, letterSpacing:-1 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display:'flex', gap:6, marginBottom:14 }}>
        {(['all','LIVE','ONLINE','IDLE','OFFLINE'] as const).map(f => (
          <button key={f} className="btn" style={{ fontSize:11, padding:'5px 12px', ...(filter===f ? {borderColor:'rgba(59,130,246,0.5)',color:'#93c5fd'} : {}) }} onClick={() => setFilter(f)}>
            {f === 'all' ? 'All' : f}
          </button>
        ))}
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">AR Device Fleet · XREAL Systems</span>
          <span style={{ fontSize:10, fontFamily:'var(--mono)', color:'var(--text3)' }}>{filtered.length} devices</span>
        </div>
        <table className="data-table">
          <thead><tr><th>Device</th><th>Model</th><th>Assigned To</th><th>Unit</th><th>Status</th><th>Last Active</th></tr></thead>
          <tbody>
            {filtered.map(d => (
              <tr key={d.id}>
                <td style={{ fontFamily:'var(--mono)', fontSize:12, fontWeight:700, color:'var(--text)' }}>{d.serial}</td>
                <td style={{ color:'var(--text)' }}>{d.model}</td>
                <td style={{ fontFamily:'var(--mono)', fontSize:11 }}>{d.assigned_to}</td>
                <td style={{ fontFamily:'var(--mono)', fontSize:11, color:'var(--text3)' }}>{d.unit}</td>
                <td>
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <div className={`d-status ${dotClass(d.status)}`} />
                    <span style={{ fontSize:10, fontFamily:'var(--mono)', color: d.status==='LIVE'||d.status==='ONLINE' ? 'var(--green)' : d.status==='IDLE' ? 'var(--amber)' : 'var(--text3)' }}>{d.status}</span>
                  </div>
                </td>
                <td style={{ fontFamily:'var(--mono)', fontSize:11, color:d.status==='LIVE'?'var(--green)':'var(--text3)' }}>{d.last_active ?? d.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
