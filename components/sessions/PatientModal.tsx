'use client';
import { useNucleusStore } from '@/store/useNucleusStore';
import { usePatient } from '@/hooks';
import { pwatColor, depthSeverityColor, formatDate } from '@/lib/utils';
import { gcsImageUrl as gcsImg, gcsTextUrl as gcsTxt } from '@/lib/api';
import { useState } from 'react';
import { MetricInfo, METRIC_DESCRIPTIONS as info } from '@/components/ui/MetricInfo';

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
  // NEW: Track which frame the user is viewing
  const [activeFrameIndex, setActiveFrameIndex] = useState(0);

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

  const s: any = patient;
  
  // NEW: Dynamic Data Mapping (Fallback to session data if no frames exist)
  const frames = s?.frames || [];
  const activeFrame = frames.length > 0 ? frames[activeFrameIndex] : null;

  const displayPwat = activeFrame?.pwat_score ?? s?.pwat_score ?? '—';
  const displayTriage = activeFrame?.triage ?? s?.triage_category;
  const displayDepthSeverity = activeFrame?.depth_severity ?? s?.wound_metrics?.depth_severity ?? '—';
  const displayArea = activeFrame?.area_pct ?? s?.wound_metrics?.area_pct;
  const displayDepthMean = activeFrame?.depth_mean ?? s?.wound_metrics?.depth_mean;
  const displaySourceImage = activeFrame?.source_image ?? s?.source_image ?? '—';
  const displayGemini = activeFrame?.gemini_text ?? s?.gemini_analysis ?? 'No analysis available.';
  const gcs: any = activeFrame?.gcs_outputs ?? s?.gcs_outputs ?? {};

  return (
    <>
      <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setActivePatientId(null); }}>
        <div className="modal modal-wide">
          <div className="modal-header">
            <div>
              <div className="modal-title">{isLoading ? 'Loading...' : `Case: ${s?.session_id}`}</div>
              <div style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'var(--mono)', marginTop: 2 }}>
                {displaySourceImage}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {displayTriage && <span className={`triage-badge triage-${displayTriage}`}>{displayTriage}</span>}
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
                {/* NEW: Frame Selector UI */}
                {frames.length > 1 && (
                  <div style={{ marginBottom: 16, padding: '10px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: 8 }}>
                    <div style={{ fontSize: 9, color: 'var(--text3)', fontFamily: 'var(--mono)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>Captured Frames</div>
                    <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
                      {frames.map((f: any, i: number) => (
                        <button
                          key={i}
                          onClick={() => setActiveFrameIndex(i)}
                          style={{
                            padding: '6px 14px',
                            borderRadius: 6,
                            fontSize: 11,
                            fontFamily: 'var(--mono)',
                            cursor: 'pointer',
                            border: activeFrameIndex === i ? '1px solid rgba(96,165,250,0.5)' : '1px solid rgba(255,255,255,0.1)',
                            background: activeFrameIndex === i ? 'rgba(96,165,250,0.1)' : 'transparent',
                            color: activeFrameIndex === i ? '#60a5fa' : 'var(--text2)',
                            transition: 'all 0.2s',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          Frame {f.frame_index ?? i + 1}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="patient-detail">
                  <div className="patient-field">
                    <div className="patient-field-label"><MetricInfo label="PWAT Score" description={info.pwat} /></div>
                    <div className="patient-field-value" style={{ fontSize: 22, fontWeight: 700, color: pwatColor(displayPwat) }}>{displayPwat}</div>
                  </div>
                  <div className="patient-field">
                    <div className="patient-field-label"><MetricInfo label="Triage Category" description={info.triage} /></div>
                    <div className="patient-field-value"><span className={`triage-badge triage-${displayTriage}`}>{displayTriage}</span></div>
                  </div>
                  <div className="patient-field">
                    <div className="patient-field-label">Recorded At</div>
                    {/* Keep Date tied to the session level created_at */}
                    <div className="patient-field-value" style={{ fontSize: 12 }}>{formatDate(s.created_at)}</div> 
                  </div>
                  <div className="patient-field">
                    <div className="patient-field-label"><MetricInfo label="Depth Severity" description={info.depthSeverity} /></div>
                    <div className="patient-field-value" style={{ color: depthSeverityColor(displayDepthSeverity === '—' ? null : displayDepthSeverity) }}>{displayDepthSeverity}</div>
                  </div>
                  {displayArea != null && (
                    <div className="patient-field">
                      <div className="patient-field-label"><MetricInfo label="Wound Area %" description={info.woundArea} /></div>
                      <div className="patient-field-value">{Number(displayArea).toFixed(1)}%</div>
                    </div>
                  )}
                  {displayDepthMean != null && (
                    <div className="patient-field">
                      <div className="patient-field-label"><MetricInfo label="Depth Mean" description={info.depthMean} /></div>
                      <div className="patient-field-value">{Number(displayDepthMean).toFixed(3)}</div>
                    </div>
                  )}
                </div>

                <div style={{ marginBottom: 14, padding: '8px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: 8 }}>
                  <div style={{ fontSize: 9, color: 'var(--text3)', fontFamily: 'var(--mono)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 }}>Source Image (Frame {activeFrameIndex + 1})</div>
                  <div style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--text2)', wordBreak: 'break-all' }}>{displaySourceImage}</div>
                </div>

                <div>
                  <div style={{ fontSize: 9, color: 'var(--text3)', fontFamily: 'var(--mono)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 }}>Gemini Clinical Analysis</div>
                  <div className="gemini-box">{displayGemini}</div>
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
