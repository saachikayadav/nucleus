'use client';
import { useAllSessions } from '@/hooks';
import { groupByDate, groupByHour } from '@/lib/utils';
import { useState } from 'react';

const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

function heatColor(count: number, max: number): string {
  if (count === 0) return 'rgba(255,255,255,0.04)';
  const intensity = count / max;
  if (intensity > 0.75) return `rgba(248,113,113,${0.6 + intensity * 0.4})`;
  if (intensity > 0.4)  return `rgba(251,191,36,${0.4 + intensity * 0.4})`;
  return `rgba(74,222,128,${0.3 + intensity * 0.4})`;
}

export default function HeatmapsPage() {
  const { data: sd, isLoading } = useAllSessions();
  const [tooltip, setTooltip] = useState<{ text:string; x:number; y:number } | null>(null);

  const sessions = sd?.sessions ?? [];
  const dateMap = groupByDate(sessions);
  const hourData = groupByHour(sessions);
  const maxHour = Math.max(...hourData.map(h => h.count), 1);

  // Build 8-week grid
  const today = new Date();
  const cells: { date:string; count:number }[] = [];
  for (let i = 55; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const ds = d.toISOString().slice(0,10);
    cells.push({ date:ds, count: dateMap.find(r => r.date === ds)?.count ?? 0 });
  }
  while (cells.length % 7 !== 0) cells.unshift({ date:'', count:0 });
  const maxCell = Math.max(...cells.map(c => c.count), 1);

  const peakHour = hourData.reduce((best, h) => h.count > best.count ? h : best, hourData[0]);

  if (isLoading) return <div style={{ display:'flex', flexDirection:'column', gap:12 }}>{[...Array(3)].map((_,i) => <div key={i} className="skeleton" style={{ height:80, borderRadius:'var(--r)' }} />)}</div>;

  if (sessions.length < 7) return (
    <div style={{ textAlign:'center', padding:60, color:'var(--text3)', fontFamily:'var(--mono)', fontSize:12 }}>
      Not enough data to generate heatmap.<br/>More sessions needed ({sessions.length} / 7 minimum).
    </div>
  );

  return (
    <>
      {tooltip && (
        <div className="tooltip" style={{ left:tooltip.x+14, top:tooltip.y-10, opacity:1 }}>{tooltip.text}</div>
      )}

      <div className="card" style={{ marginBottom:16 }}>
        <div className="card-header"><span className="card-title">Incident Activity Heatmap · Last 8 Weeks</span><span className="badge badge-live">REAL DATA</span></div>
        <div className="heatmap-area">
          <div className="hmap-day-labels">{DAYS.map(d => <div key={d} className="hmap-day-label">{d}</div>)}</div>
          <div className="heatmap-grid">
            {cells.map((cell, i) => (
              <div key={i} className="hmap-cell"
                style={{ background: cell.date ? heatColor(cell.count, maxCell) : 'transparent', border: cell.date ? '1px solid transparent' : 'none' }}
                onMouseEnter={e => {
                  if (cell.date) setTooltip({ text:`${cell.count} session${cell.count!==1?'s':''} · ${cell.date}`, x:e.clientX, y:e.clientY });
                }}
                onMouseLeave={() => setTooltip(null)}
              />
            ))}
          </div>
          <div className="hmap-legend">
            <span className="hmap-legend-label">Less</span>
            <div className="hmap-legend-strip">
              {[0.04,0.15,0.3,0.5,0.8].map((o,i) => <div key={i} className="hmap-legend-cell" style={{ background:`rgba(74,222,128,${o})` }} />)}
              {[0.3,0.6,0.9].map((o,i) => <div key={i} className="hmap-legend-cell" style={{ background:`rgba(248,113,113,${o})` }} />)}
            </div>
            <span className="hmap-legend-label">More</span>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Sessions by Hour of Day</span>
          <span className="badge badge-ai">{peakHour?.count > 0 ? `Peak: ${peakHour.hour}:00` : 'NO DATA'}</span>
        </div>
        <div style={{ padding:'16px 18px' }}>
          <div style={{ display:'flex', gap:3, alignItems:'flex-end', height:80 }}>
            {hourData.map(h => {
              const pct = maxHour > 0 ? (h.count / maxHour) * 100 : 0;
              const isPeak = h.hour === peakHour?.hour && peakHour.count > 0;
              return (
                <div key={h.hour} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}
                  onMouseEnter={e => setTooltip({ text:`${h.hour}:00 — ${h.count} session${h.count!==1?'s':''}`, x:e.clientX, y:e.clientY })}
                  onMouseLeave={() => setTooltip(null)}>
                  <div style={{ width:'100%', height:`${Math.max(pct, 4)}%`, background: isPeak ? 'var(--accent)' : 'rgba(59,130,246,0.3)', borderRadius:'2px 2px 0 0', transition:'all 0.2s', boxShadow: isPeak ? '0 0 8px var(--accent-glow)' : 'none', minHeight: 2 }} />
                </div>
              );
            })}
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', marginTop:6 }}>
            {[0,6,12,18,23].map(h => <span key={h} style={{ fontSize:9, color:'var(--text3)', fontFamily:'var(--mono)' }}>{h}:00</span>)}
          </div>
        </div>
      </div>
    </>
  );
}
