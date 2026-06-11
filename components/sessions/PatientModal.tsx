'use client';
import { useNucleusStore } from '@/store/useNucleusStore';
import { usePatient } from '@/hooks';
import { pwatColor, depthSeverityColor, formatDate } from '@/lib/utils';
import { gcsImageUrl as gcsImg, gcsTextUrl as gcsTxt } from '@/lib/api';
import { useState } from 'react';

function imgTile(path: string, label: string, onOpen: (p: string, l: string) => void) {
  if (!path) return null;
  return (
    <div
      key={label}
      onClick={() => onOpen(path, label)}
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, overflow: 'hidden', cursor: 'pointer', transition: 'all 0.2s ease' }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(96,165,250,0.35)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)'; }}
    >
      <div style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text)' }}>{label}</div>
        <div style={{ fontSize: 9, color: 'var(--text3)', fontFamily: 'var(--mono)', letterSpacing: 1 }}>CLICK</div>
      </div>
      <div style={{ padding: 10, background: 'black' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={gcsImg(path)} loading="lazy" alt={label}
          style={{ width: '100%', height: 220, objectFit: 'contain', borderRadius: 8, background: 'black' }}
          onError={(e) => { (e.target as HTMLImageElement).parentElement!.innerHTML = '<div style="height:220px;display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,0.35);font-size:11px;font-family:var(--mono)">Failed to load</div>'; }}
        />
      </div>
    </div>
  );
}

export default function PatientModal() {
  const activePatientId = useNucleusStore((s) => s.activePatientId);
  const setActivePatientId = useNucleusStore((s) => s.setActivePatientId);
  const { data: patient, isLoading } = usePatient(activePatientId);
  const [lightbox, setLightbox] = useState<{ path: string; title: string } | null>(null);
  const [reportText, setReportText] = useState<string | null>(null);

  if (!activePatientId) return null;

  const openImage = (path: string, title: string) => setLightbox({ path, title });

  const openReport = async (path: string) => {
    setReportText('Loading...');
    try {
      const res = await fetch(gcsTxt(path));
      const text = await res.text();
      setReportText(text);
    } catch {
      setReportText('Failed to load report.');
    }
  };

  const s = patient;
  const wm: any = s?.wound_metrics ?? {};
  const gcs: any = s?.gcs_outputs ?? {};

  return (
    <>
      <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setActivePatientId(null); }}>
        <div className="modal modal-wide">
          <div className="modal-header">
            <div>
              <div className="modal-title">{isLoading ? 'Loading...' : `Case: ${s?.session_id}`}</div>
              <div style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'var(--mono)', marginTop: 2 }}>
                {s?.source_image ?? '—'}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {s && <span className={`triage-badge triage-${s.triage_category}`}>{s.triage_category}</span>}
              <div className="modal-close" onClick={() => setActivePatientId(null)}>✕</div>
            </div>
          </div>

          <div className="modal-body">
            {isLoading ? (
              <>
                <div className="skeleton" style={{ width: '100%', height: 18, marginBottom: 8 }} />
                <div className="skeleton" style={{ width: '80%', height: 14 }} />
              </>
            ) : s ? (
              <>
                <div className="patient-detail">
                  <div className="patient-field">
                    <div className="patient-field-label">PWAT Score</div>
                    <div className="patient-field-value" style={{ fontSize: 22, fontWeight: 700, color: pwatColor(s.pwat_score) }}>{s.pwat_score ?? '—'}</div>
                  </div>
                  <div className="patient-field">
                    <div className="patient-field-label">Triage Category</div>
                    <div className="patient-field-value"><span className={`triage-badge triage-${s.triage_category}`}>{s.triage_category}</span></div>
                  </div>
                  <div className="patient-field">
                    <div className="patient-field-label">Recorded At</div>
                    <div className="patient-field-value" style={{ fontSize: 12 }}>{formatDate(s.created_at)}</div>
                  </div>
                  <div className="patient-field">
                    <div className="patient-field-label">Depth Severity</div>
                    <div className="patient-field-value" style={{ color: depthSeverityColor(wm.depth_severity ?? null) }}>{wm.depth_severity ?? '—'}</div>
                  </div>
                  {wm.area_pct != null && (
                    <div className="patient-field">
                      <div className="patient-field-label">Wound Area %</div>
                      <div className="patient-field-value">{Number(wm.area_pct).toFixed(1)}%</div>
                    </div>
                  )}
                  {wm.depth_mean != null && (
                    <div className="patient-field">
                      <div className="patient-field-label">Depth Mean</div>
                      <div className="patient-field-value">{Number(wm.depth_mean).toFixed(3)}</div>
                    </div>
                  )}
                </div>

                <div style={{ marginBottom: 14, padding: '8px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: 8 }}>
                  <div style={{ fontSize: 9, color: 'var(--text3)', fontFamily: 'var(--mono)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 }}>Source Image</div>
                  <div style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--text2)', wordBreak: 'break-all' }}>{s.source_image || '—'}</div>
                </div>

                <div>
                  <div style={{ fontSize: 9, color: 'var(--text3)', fontFamily: 'var(--mono)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 }}>Gemini Clinical Analysis</div>
                  <div className="gemini-box">{s.gemini_analysis || 'No analysis available.'}</div>
                </div>

                <div style={{ marginTop: 20 }}>
                  <div style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'var(--mono)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>Generated Clinical Outputs</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
                    {imgTile(gcs.cropped_image, 'Cropped Wound', openImage)}
                    {imgTile(gcs.segmentation_mask, 'Segmentation Mask', openImage)}
                    {imgTile(gcs.wound_mask_overlay, 'Wound Overlay', openImage)}
                    {imgTile(gcs.peri_mask_overlay, 'Peri-Wound Overlay', openImage)}
                    {imgTile(gcs.segmentation_figure, 'Segmentation Figure', openImage)}
                    {imgTile(gcs.depth_figure, 'Depth Figure', openImage)}
                    {imgTile(gcs.depth_map, 'Depth Heatmap', openImage)}
                  </div>
                </div>
              </>
            ) : (
              <div style={{ color: 'var(--red)', fontFamily: 'var(--mono)', fontSize: 12 }}>Failed to load patient record.</div>
            )}
          </div>

          <div className="modal-footer">
            <button className="btn" onClick={() => setActivePatientId(null)}>Close</button>
            {s && gcs.gemini_report && (
              <button className="btn btn-accent" onClick={() => openReport(gcs.gemini_report)}>
                📄 Gemini Report
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.85)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, backdropFilter: 'blur(12px)', cursor: 'zoom-out' }}
          onClick={() => setLightbox(null)}>
          <div style={{ fontSize: 12, color: 'rgba(240,244,255,0.5)', fontFamily: 'var(--mono)', letterSpacing: 2, textTransform: 'uppercase' }}>{lightbox.title}</div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={gcsImg(lightbox.path)} alt={lightbox.title} style={{ maxWidth: '90vw', maxHeight: '80vh', borderRadius: 12, border: '1px solid rgba(255,255,255,0.15)' }} />
          <div style={{ fontSize: 11, color: 'rgba(240,244,255,0.3)', fontFamily: 'var(--mono)' }}>click anywhere to close</div>
        </div>
      )}

      {/* Report viewer */}
      {reportText !== null && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9998, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, backdropFilter: 'blur(12px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setReportText(null); }}>
          <div style={{ width: '100%', maxWidth: 680, background: 'rgba(6,12,24,0.95)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '80vh' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#f0f4ff' }}>📄 Gemini Clinical Report</span>
              <div onClick={() => setReportText(null)} style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 11, color: 'rgba(240,244,255,0.5)' }}>✕</div>
            </div>
            <pre style={{ padding: 18, fontFamily: 'var(--mono)', fontSize: 11, color: 'rgba(240,244,255,0.7)', lineHeight: 1.8, overflowY: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0 }}>
              {reportText}
            </pre>
          </div>
        </div>
      )}
    </>
  );
}
