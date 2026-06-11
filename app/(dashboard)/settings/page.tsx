'use client';
import { useSession, signOut } from 'next-auth/react';
import { useNucleusStore } from '@/store/useNucleusStore';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { checkHealth } from '@/lib/api';

export default function SettingsPage() {
  const { data: session } = useSession();
  const { refreshInterval, setRefreshInterval, sessionsPerPage, setSessionsPerPage } = useNucleusStore();
  const qc = useQueryClient();
  const [healthStatus, setHealthStatus] = useState<null | 'ok' | 'error'>('ok');
  const [testing, setTesting] = useState(false);

  const testConnection = async () => {
    setTesting(true);
    setHealthStatus(null);
    try { await checkHealth(); setHealthStatus('ok'); }
    catch  { setHealthStatus('error'); }
    finally { setTesting(false); }
  };

  const Section = ({ title, children }: any) => (
    <div style={{ marginBottom:24 }}>
      <div style={{ fontSize:9, color:'var(--text3)', fontFamily:'var(--mono)', letterSpacing:3, textTransform:'uppercase', marginBottom:12, paddingBottom:8, borderBottom:'1px solid var(--border)' }}>{title}</div>
      {children}
    </div>
  );

  const Row = ({ label, sub, children }: any) => (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
      <div><div style={{ fontSize:12, fontWeight:500, color:'var(--text)' }}>{label}</div>{sub && <div style={{ fontSize:11, color:'var(--text3)', fontFamily:'var(--mono)', marginTop:2 }}>{sub}</div>}</div>
      {children}
    </div>
  );

  return (
    <div style={{ maxWidth:640 }}>
      <Section title="API Configuration">
        <Row label="Backend Endpoint" sub="GCP Cloud Run · wound_ai dataset">
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ fontSize:10, fontFamily:'var(--mono)', color:'var(--text3)' }}>
              {process.env.NEXT_PUBLIC_API_BASE?.replace('https://','')}
            </span>
            <button className="btn" style={{ fontSize:11, padding:'4px 12px' }} onClick={testConnection} disabled={testing}>
              {testing ? '…' : 'Test'}
            </button>
            {healthStatus === 'ok'    && <span style={{ fontSize:11, color:'var(--green)', fontFamily:'var(--mono)' }}>✓ Online</span>}
            {healthStatus === 'error' && <span style={{ fontSize:11, color:'var(--red)', fontFamily:'var(--mono)' }}>✕ Offline</span>}
          </div>
        </Row>
      </Section>

      <Section title="Display Preferences">
        <Row label="Auto-Refresh Interval" sub="How often the dashboard polls the API">
          <select className="form-select" style={{ width:160, padding:'6px 10px', fontSize:12 }}
            value={refreshInterval} onChange={e => setRefreshInterval(Number(e.target.value))}>
            <option value={0}>Off</option>
            <option value={30000}>30 seconds</option>
            <option value={60000}>60 seconds</option>
            <option value={300000}>5 minutes</option>
          </select>
        </Row>
        <Row label="Sessions Per Page" sub="Max sessions loaded per API call">
          <select className="form-select" style={{ width:100, padding:'6px 10px', fontSize:12 }}
            value={sessionsPerPage} onChange={e => setSessionsPerPage(Number(e.target.value))}>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </Row>
      </Section>

      <Section title="Account">
        <Row label={session?.user?.name ?? 'Signed In'} sub={session?.user?.email ?? ''}>
          <button className="btn btn-danger" style={{ fontSize:11, padding:'5px 14px' }} onClick={() => signOut({ callbackUrl:'/auth/signin' })}>
            Sign Out
          </button>
        </Row>
      </Section>

      <Section title="System Info">
        {[
          ['Backend',   'GCP Cloud Run'],
          ['Dataset',   'wound_ai.sessions'],
          ['AI Model',  'Gemini Vision v3.1'],
          ['App Build', 'Valkyra Nucleus 1.0'],
        ].map(([k, v]) => (
          <Row key={k} label={k}>
            <span style={{ fontSize:11, fontFamily:'var(--mono)', color:'var(--text3)' }}>{v}</span>
          </Row>
        ))}
      </Section>

      <Section title="Danger Zone">
        <Row label="Clear Query Cache" sub="Forces a fresh fetch of all data">
          <button className="btn btn-danger" style={{ fontSize:11, padding:'5px 14px' }} onClick={() => qc.clear()}>
            Clear Cache
          </button>
        </Row>
        <Row label="Reset App Settings" sub="Restores default refresh interval and page size">
          <button className="btn btn-danger" style={{ fontSize:11, padding:'5px 14px' }} onClick={() => { setRefreshInterval(60000); setSessionsPerPage(20); }}>
            Reset
          </button>
        </Row>
      </Section>
    </div>
  );
}
