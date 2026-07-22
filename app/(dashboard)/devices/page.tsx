'use client';

import { useState } from 'react';
import { motion, Variants, AnimatePresence } from 'framer-motion';

// --- MOCK DEVICE FLEET DATA ---
const MOCK_DEVICES = [
  { id: 'VK-7701', model: 'Valkyra Pro V2', firmware: 'v4.1.2', battery: 88, status: 'Online', lastSync: 'Just now', assignedTo: 'Sgt. Elias Vance' },
  { id: 'VK-7702', model: 'Valkyra Pro V2', firmware: 'v4.1.2', battery: 12, status: 'Low Battery', lastSync: '2 mins ago', assignedTo: 'Cpl. Sarah Jenkins' },
  { id: 'VK-7705', model: 'Valkyra Lite', firmware: 'v3.9.0', battery: 45, status: 'Sync Error', lastSync: '4 hours ago', assignedTo: 'Pvt. James Cobb' },
  { id: 'VK-7709', model: 'Valkyra Pro V2', firmware: 'v4.1.2', battery: 0, status: 'Offline', lastSync: '2 days ago', assignedTo: 'Unassigned' },
  { id: 'VK-7712', model: 'Valkyra Pro V1', firmware: 'v3.8.5', battery: 100, status: 'Online', lastSync: '1 min ago', assignedTo: 'Unassigned' },
];

// --- ANIMATIONS ---
const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

export default function DevicesPage() {
  const [modalOpen, setModalOpen] = useState<string | null>(null);

  // Filter out any devices that are not healthy to show in the top alert banner
  const alerts = MOCK_DEVICES.filter(d => d.status !== 'Online');

  return (
    <div className="pb-32">

      {/* HEALTH ALERTS BANNER */}
      <AnimatePresence>
        {alerts.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="card" 
            style={{ marginBottom: 24, background: 'rgba(248,113,113,0.05)', borderColor: 'rgba(248,113,113,0.3)', padding: '16px 20px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(248,113,113,0.8)]" />
              <span style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--red)', textTransform: 'uppercase', letterSpacing: 2 }}>
                System Alerts ({alerts.length})
              </span>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
              {alerts.map(a => (
                <div key={`alert-${a.id}`} style={{ padding: 12, background: 'rgba(0,0,0,0.4)', borderRadius: 6, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 13, fontWeight: 'bold', color: 'var(--text)', marginBottom: 4, fontFamily: 'var(--mono)' }}>{a.id}</div>
                  <div style={{ fontSize: 10, fontFamily: 'var(--mono)', color: a.status === 'Low Battery' ? 'var(--amber)' : 'var(--red)' }}>
                    {a.status} · Last Sync: {a.lastSync}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DEVICE GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <motion.div variants={staggerContainer} initial="hidden" animate="show" className="contents">
          {MOCK_DEVICES.map((d) => {
            const isOnline = d.status === 'Online';
            const isWarning = d.status === 'Low Battery' || d.status === 'Sync Error';
            
            return (
              <motion.div 
                variants={{ hidden: { opacity: 0, scale: 0.95 }, show: { opacity: 1, scale: 1 } }} 
                key={d.id} 
                className="card relative overflow-hidden" 
                style={{ display: 'flex', flexDirection: 'column', padding: '20px' }}
              >
                {/* Top Status Border */}
                <div className="absolute top-0 left-0 w-full h-1" style={{ background: isOnline ? 'var(--cyan)' : isWarning ? 'var(--amber)' : 'var(--red)' }} />
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 'bold', fontFamily: 'var(--mono)', color: 'var(--text)' }}>{d.id}</div>
                    <div style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--text3)', marginTop: 4 }}>
                      {d.model} <span style={{ opacity: 0.5 }}>·</span> {d.firmware}
                    </div>
                  </div>
                  <span className={`triage-badge ${isOnline ? 'triage-Blue' : isWarning ? 'triage-Orange' : 'triage-Red'} uppercase`}>
                    {d.status}
                  </span>
                </div>

                {/* Battery Indicator */}
                <div style={{ marginBottom: 24 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--text2)', marginBottom: 8 }}>
                    <span>Internal Battery</span>
                    <span style={{ color: d.battery > 20 ? 'var(--green)' : 'var(--red)' }}>{d.battery}%</span>
                  </div>
                  <div style={{ width: '100%', height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${d.battery}%`, background: d.battery > 20 ? 'var(--green)' : 'var(--red)', boxShadow: `0 0 8px ${d.battery > 20 ? 'var(--green)' : 'var(--red)'}` }} />
                  </div>
                </div>

                {/* Assignment Box */}
                <div style={{ flex: 1, padding: '12px', background: 'rgba(0,0,0,0.3)', borderRadius: 6, border: '1px solid var(--border)', marginBottom: 16 }}>
                  <div style={{ fontSize: 9, fontFamily: 'var(--mono)', color: 'var(--text3)', textTransform: 'uppercase', marginBottom: 6, letterSpacing: 1 }}>Assigned Responder</div>
                  <div style={{ fontSize: 13, color: d.assignedTo === 'Unassigned' ? 'var(--text3)' : 'var(--text)' }}>
                    {d.assignedTo}
                  </div>
                </div>

                {/* Action Button */}
                <button 
                  onClick={() => setModalOpen(d.id)}
                  className="btn" 
                  style={{ 
                    width: '100%', 
                    justifyContent: 'center', 
                    padding: '10px',
                    borderColor: d.assignedTo === 'Unassigned' ? 'rgba(34,211,238,0.4)' : 'var(--border)', 
                    color: d.assignedTo === 'Unassigned' ? 'var(--cyan)' : 'var(--text2)',
                    background: d.assignedTo === 'Unassigned' ? 'rgba(34,211,238,0.05)' : 'transparent'
                  }}
                >
                  {d.assignedTo === 'Unassigned' ? '+ ASSIGN TO MEDIC' : 'MANAGE ASSIGNMENT'}
                </button>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
}