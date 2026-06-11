'use client';
import { useState } from 'react';
import { useAllSessions } from '@/hooks';
import { useNucleusStore } from '@/store/useNucleusStore';
import { pwatColor, triageClass, formatDate, depthSeverityColor } from '@/lib/utils';

export default function ReportsPage() {
  const { data: sd, isLoading } = useAllSessions();
  const setActivePatientId = useNucleusStore((s) => s.setActivePatientId);
  const [search, setSearch] = useState('');
  const [triageFilter, setTriageFilter] = useState('all');
  const [page, setPage] = useState(0);
  const PER_PAGE = 10;

  const sessions = sd?.sessions ?? [];
  const filtered = sessions
    .filter(s => triageFilter === 'all' || s.triage_category === triageFilter)
    .filter(s => !search || s.session_id.toLowerCase().includes(search.toLowerCase()) || (s.gemini_analysis ?? '').toLowerCase().includes(search.toLowerCase()));

  const paged = filtered.slice(0, (page + 1) * PER_PAGE);

  return (
    <>
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <input className="form-input" placeholder="Search session ID or analysis..." value={search} onChange={e => { setSearch(e.target.value); setPage(0); }}
          style={{ flex: 1, minWidth: 240, padding: '8px 12px', fontSize: 12 }} />
        <div style={{ display: 'flex', gap: 6 }}>
          {(['all','Red','Orange','Yellow','Green'] as const).map(f => (
            <button key={f} className="btn" style={{ fontSize: 11, padding: '5px 12px', ...(triageFilter === f ? { borderColor: 'rgba(59,130,246,0.5)', color: '#93c5fd' } : {}) }}
              onClick={() => { setTriageFilter(f); setPage(0); }}>
              {f === 'all' ? 'All' : f}
            </button>
          ))}
        </div>
      </div>

      <div className="section-hd">
        <div className="section-title">Clinical Session Reports · {filtered.length} records</div>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: 120, borderRadius: 'var(--r)' }} />)}
        </div>
      ) : paged.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text3)', fontFamily: 'var(--mono)', fontSize: 12 }}>
          No reports match the current filter.
          <br /><span className="see-all" onClick={() => { setSearch(''); setTriageFilter('all'); }}>Reset filters ›</span>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {paged.map(s => {
            const wm = s.wound_metrics ?? {} as any;
            const preview = (s.gemini_analysis ?? 'No analysis available.').slice(0, 220);
            return (
              <div key={s.session_id} className="card" style={{ cursor: 'pointer' }} onClick={() => setActivePatientId(s.session_id)}>
                <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>{s.session_id}</span>
                    <span className={`triage-badge triage-${s.triage_category}`}>{s.triage_category}</span>
                  </div>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text3)' }}>{formatDate(s.created_at)}</span>
                </div>
                <div style={{ padding: '14px 18px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                  <div>
                    <div style={{ fontSize: 9, color: 'var(--text3)', fontFamily: 'var(--mono)', letterSpacing: 2, marginBottom: 4 }}>PWAT SCORE</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: pwatColor(s.pwat_score) }}>{s.pwat_score}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 9, color: 'var(--text3)', fontFamily: 'var(--mono)', letterSpacing: 2, marginBottom: 4 }}>DEPTH</div>
                    <div style={{ fontSize: 13, color: depthSeverityColor(wm.depth_severity) }}>{wm.depth_severity ?? '—'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 9, color: 'var(--text3)', fontFamily: 'var(--mono)', letterSpacing: 2, marginBottom: 4 }}>WOUND AREA</div>
                    <div style={{ fontSize: 13, color: 'var(--text)' }}>{wm.area_pct != null ? Number(wm.area_pct).toFixed(1)+'%' : '—'}</div>
                  </div>
                </div>
                <div style={{ padding: '0 18px 14px' }}>
                  <div style={{ fontSize: 9, color: 'var(--text3)', fontFamily: 'var(--mono)', letterSpacing: 2, marginBottom: 6, textTransform: 'uppercase' }}>Gemini Analysis</div>
                  <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.6 }}>
                    {preview}{(s.gemini_analysis ?? '').length > 220 ? '...' : ''}
                    <span style={{ color: 'var(--cyan)', marginLeft: 6, fontSize: 11, fontFamily: 'var(--mono)' }}>Read full →</span>
                  </div>
                </div>
              </div>
            );
          })}
          {filtered.length > paged.length && (
            <button className="btn" style={{ alignSelf: 'center', padding: '10px 32px' }} onClick={() => setPage(p => p+1)}>
              Load More ({filtered.length - paged.length} remaining)
            </button>
          )}
        </div>
      )}
    </>
  );
}
