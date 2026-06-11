'use client';
import { useState } from 'react';
import { useSummary, useAllSessions, useIncidents, useResolveIncident } from '@/hooks';
import { useNucleusStore } from '@/store/useNucleusStore';
import { pwatColor, triageClass, formatDate, depthSeverityColor } from '@/lib/utils';

export default function IncidentsPage() {
  const { data: summary } = useSummary();
  const { data: sessionsData, isLoading } = useAllSessions();
  const { data: incidentsData } = useIncidents();
  const { mutate: resolve } = useResolveIncident();
  const setActivePatientId = useNucleusStore((s) => s.setActivePatientId);
  const [triageFilter, setTriageFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<'newest' | 'pwat_desc' | 'pwat_asc'>('newest');

  const sessions = sessionsData?.sessions ?? [];
  const incidents = incidentsData?.incidents ?? [];
  const triage = summary?.triage_distribution ?? {} as any;
  const totalCases = summary?.total_cases ?? 0;

  let filtered = sessions
    .filter(s => triageFilter === 'all' || s.triage_category === triageFilter)
    .filter(s => !search || s.session_id.toLowerCase().includes(search.toLowerCase()));

  if (sort === 'newest') filtered = [...filtered].sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  else if (sort === 'pwat_desc') filtered = [...filtered].sort((a,b) => b.pwat_score - a.pwat_score);
  else filtered = [...filtered].sort((a,b) => a.pwat_score - b.pwat_score);

  return (
    <>
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total Sessions', value: totalCases, color: 'cv-blue' },
          { label: 'Critical Red',   value: triage.Red?.count ?? 0, color: 'cv-red' },
          { label: 'Avg PWAT',       value: summary ? Number(summary.avg_pwat).toFixed(1) : '—', color: 'cv-amber' },
        ].map(c => (
          <div key={c.label} style={{ flex: 1, background: 'var(--glass)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '14px 18px' }}>
            <div style={{ fontSize: 9, color: 'var(--text3)', fontFamily: 'var(--mono)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 }}>{c.label}</div>
            <div className={`metric-value ${c.color}`} style={{ fontSize: 24 }}>{c.value}</div>
          </div>
        ))}
      </div>

      {incidents.filter(i => i.status === 'Active').length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div className="section-hd"><div className="section-title">Active Deployed Incidents</div><span className="badge badge-red">{incidents.filter(i=>i.status==='Active').length} ACTIVE</span></div>
          <div className="card">
            <table className="data-table">
              <thead><tr><th>ID</th><th>Type</th><th>Responder</th><th>Device</th><th>Location</th><th>Deployed</th><th>Action</th></tr></thead>
              <tbody>
                {incidents.filter(i=>i.status==='Active').map(inc => (
                  <tr key={inc.id}>
                    <td style={{ fontFamily: 'var(--mono)', color: 'var(--text)', fontWeight: 600 }}>{inc.id}</td>
                    <td><span className="feed-type t-gsw">{inc.type}</span></td>
                    <td style={{ color: 'var(--text)' }}>{inc.responder}</td>
                    <td style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>{inc.device}</td>
                    <td>{inc.location}</td>
                    <td style={{ fontFamily: 'var(--mono)' }}>{formatDate(inc.created_at)}</td>
                    <td>
                      <button className="btn btn-success" style={{ fontSize: 10, padding: '4px 10px' }} onClick={() => resolve(inc.id)}>
                        ✓ Resolve
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="section-hd"><div className="section-title">Patient Sessions · Wound AI Database</div></div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
        <input className="form-input" placeholder="Search session ID..." value={search} onChange={e => setSearch(e.target.value)}
          style={{ width: 220, padding: '6px 12px', fontSize: 12 }} />
        <select className="form-select" value={sort} onChange={e => setSort(e.target.value as any)}
          style={{ width: 180, padding: '6px 12px', fontSize: 12 }}>
          <option value="newest">Newest First</option>
          <option value="pwat_desc">PWAT High → Low</option>
          <option value="pwat_asc">PWAT Low → High</option>
        </select>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['all','Red','Orange','Yellow','Green'] as const).map(f => (
            <button key={f} className="btn" style={{ fontSize: 11, padding: '5px 12px', ...(triageFilter===f ? { borderColor: 'rgba(59,130,246,0.5)', color: '#93c5fd' } : {}) }}
              onClick={() => setTriageFilter(f)}>
              {f === 'all' ? 'All' : f}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Patient Sessions</span>
          <span className="badge badge-live">{filtered.length} RESULTS</span>
        </div>
        {isLoading ? (
          <div style={{ padding: '20px 18px' }}>
            {[...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: 14, marginBottom: 10 }} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '20px 18px', textAlign: 'center', color: 'var(--text3)', fontFamily: 'var(--mono)', fontSize: 12 }}>
            No sessions match filter.&nbsp;
            <span className="see-all" onClick={() => { setSearch(''); setTriageFilter('all'); }}>Reset ›</span>
          </div>
        ) : (
          <table className="data-table">
            <thead><tr><th>Session ID</th><th>Triage</th><th>PWAT</th><th>Depth</th><th>Area %</th><th>Recorded</th><th></th></tr></thead>
            <tbody>
              {filtered.map(s => {
                const wm = s.wound_metrics ?? {} as any;
                return (
                  <tr key={s.session_id} style={{ cursor: 'pointer' }} onClick={() => setActivePatientId(s.session_id)}>
                    <td style={{ fontFamily: 'var(--mono)', color: 'var(--text)', fontWeight: 600, fontSize: 11 }}>{s.session_id}</td>
                    <td><span className={`feed-type ${triageClass(s.triage_category)}`}>{s.triage_category}</span></td>
                    <td style={{ color: pwatColor(s.pwat_score), fontWeight: 700, fontFamily: 'var(--mono)' }}>{s.pwat_score}</td>
                    <td style={{ color: depthSeverityColor(wm.depth_severity), fontFamily: 'var(--mono)', fontSize: 11 }}>{wm.depth_severity ?? '—'}</td>
                    <td style={{ fontFamily: 'var(--mono)' }}>{wm.area_pct != null ? Number(wm.area_pct).toFixed(1)+'%' : '—'}</td>
                    <td style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>{formatDate(s.created_at)}</td>
                    <td><span style={{ fontSize: 10, color: 'var(--accent)', fontFamily: 'var(--mono)' }}>Open →</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
