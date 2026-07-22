'use client';

import { useState } from 'react';
import { motion, Variants } from 'framer-motion';

const MOCK_RESPONDERS = [
  { id: 'R-092', name: 'Sgt. Elias Vance', rank: 'Lead Medic', unit: 'North Unit', usageRate: 94, incidents: 142, escalationRate: 12, aiScore: 98 },
  { id: 'R-104', name: 'Cpl. Sarah Jenkins', rank: 'Combat Medic', unit: 'South Unit', usageRate: 68, incidents: 89, escalationRate: 34, aiScore: 76 },
  { id: 'R-118', name: 'Lt. Marcus Thorne', rank: 'Medical Officer', unit: 'East Wing', usageRate: 100, incidents: 215, escalationRate: 5, aiScore: 99 },
  { id: 'R-201', name: 'Pvt. James Cobb', rank: 'Field Medic', unit: 'West Wing', usageRate: 45, incidents: 32, escalationRate: 55, aiScore: 62 },
];

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const rowVariant: Variants = {
  hidden: { opacity: 0, x: -20 },
  show: { opacity: 1, x: 0, transition: { duration: 0.3, ease: 'easeOut' } }
};

export default function RespondersPage() {
  const [search, setSearch] = useState('');

  const filtered = MOCK_RESPONDERS.filter(r => r.name.toLowerCase().includes(search.toLowerCase()) || r.unit.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="pb-32">

      <div className="card" style={{ padding: '16px', marginBottom: 24, display: 'flex', gap: 16 }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input 
            className="form-input" 
            placeholder="Search by Name or Unit..." 
            value={search} 
            onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', paddingLeft: '36px' }} 
          />
        </div>
        <button className="btn" style={{ borderColor: 'rgba(34,211,238,0.3)', color: 'var(--cyan)' }}>
          + ADD RESPONDER
        </button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, padding: '16px 24px', borderBottom: '1px solid var(--border)', fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 1, background: 'rgba(0,0,0,0.2)' }}>
          <div style={{ width: 250 }}>Personnel</div>
          <div style={{ width: 150 }}>Deployment Unit</div>
          <div style={{ flex: 1 }}>Hardware Usage Rate</div>
          <div style={{ width: 120, textAlign: 'right' }}>Incidents</div>
          <div style={{ width: 150, textAlign: 'right' }}>Escalation Rate</div>
        </div>

        <motion.div variants={staggerContainer} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column' }}>
          {filtered.map((r, i) => (
            <motion.div variants={rowVariant} key={r.id} className="hover:bg-white/[0.02]" style={{ display: 'flex', alignItems: 'center', gap: 24, padding: '16px 24px', borderBottom: i === filtered.length - 1 ? 'none' : '1px solid var(--border)', transition: 'background 0.2s' }}>
              <div style={{ width: 250 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>{r.name}</div>
                <div style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--text3)' }}>{r.id} · {r.rank}</div>
              </div>
              
              <div style={{ width: 150, fontSize: 12, color: 'var(--text2)' }}>{r.unit}</div>
              
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' }}>
                  <motion.div initial={{ width: 0 }} animate={{ width: `${r.usageRate}%` }} transition={{ duration: 1 }} style={{ height: '100%', background: r.usageRate > 80 ? 'var(--cyan)' : r.usageRate > 50 ? 'var(--amber)' : 'var(--red)' }} />
                </div>
                <div style={{ fontSize: 11, fontFamily: 'var(--mono)', color: r.usageRate > 80 ? 'var(--cyan)' : r.usageRate > 50 ? 'var(--amber)' : 'var(--red)', width: 40 }}>
                  {r.usageRate}%
                </div>
              </div>

              <div style={{ width: 120, textAlign: 'right', fontSize: 14, fontFamily: 'var(--mono)', fontWeight: 'bold', color: 'var(--text)' }}>
                {r.incidents}
              </div>

              <div style={{ width: 150, display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                <span className={`triage-badge ${r.escalationRate > 30 ? 'triage-Red' : r.escalationRate > 15 ? 'triage-Orange' : 'triage-Green'} uppercase`}>
                  {r.escalationRate}% BYPASS
                </span>
                <span style={{ fontSize: 9, fontFamily: 'var(--mono)', color: 'var(--text3)', marginTop: 6 }}>AI Score: {r.aiScore}</span>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}