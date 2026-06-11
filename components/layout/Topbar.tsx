'use client';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNucleusStore } from '@/store/useNucleusStore';

const TITLES: Record<string, string> = {
  '/overview':       'Command Overview',
  '/incidents':      'Live Incidents',
  '/analytics':      'Analytics',
  '/reports':        'Incident Reports',
  '/responders':     'Responders',
  '/devices':        'AR Devices',
  '/ai-performance': 'AI Performance',
  '/heatmaps':       'Heatmaps',
  '/settings':       'Settings',
};

export default function Topbar() {
  const pathname = usePathname();
  const [clock, setClock] = useState('');
  const qc = useQueryClient();
  const setIncidentModalOpen = useNucleusStore((s) => s.setIncidentModalOpen);

  useEffect(() => {
    const tick = () => {
      const n = new Date();
      const h = n.getHours(), m = n.getMinutes(), s = n.getSeconds();
      const ap = h >= 12 ? 'PM' : 'AM';
      const hh = (h % 12 || 12).toString().padStart(2, '0');
      setClock(`${hh}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')} ${ap}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const handleRefresh = () => qc.invalidateQueries();

  return (
    <div className="topbar">
      <div>
        <div className="page-title">{TITLES[pathname] ?? 'Nucleus'}</div>
        <div className="page-sub">
          Valkyra Hospital API · <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text3)' }}>{clock}</span>
        </div>
      </div>
      <div className="topbar-right">
        <div className="status-pill">
          <div className="pulse-dot" />
          LIVE
        </div>
        <button className="btn" onClick={handleRefresh}>↻ Refresh</button>
        <button className="btn btn-accent" onClick={() => setIncidentModalOpen(true)}>
          + New Incident
        </button>
      </div>
    </div>
  );
}
