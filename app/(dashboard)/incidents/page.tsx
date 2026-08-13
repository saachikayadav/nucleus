'use client';
import { useState, useEffect } from 'react';
import { useIncidents, useResolveIncident, usePermission } from '@/hooks';
import { motion, AnimatePresence } from 'framer-motion';
import { PERMISSIONS } from '@/lib/rbac';

// 🛡️ IMPORTS FOR THE PERSONALIZED VOICE TOUR
import { useSession } from 'next-auth/react';
import VoiceTour, { TourStep } from '@/components/VoiceTour';

// --- Live Mission Clock Component ---
function MissionClock({ startTime }: { startTime: string }) {
  const [elapsed, setElapsed] = useState('00:00:00');

  useEffect(() => {
    // For realistic demo purposes, pretend the incident started between 2 and 45 minutes ago
    const mockStartTime = Date.now() - (Math.random() * 43 * 60000 + 120000);
    
    const update = () => {
      const diff = Math.floor((Date.now() - mockStartTime) / 1000);
      const h = Math.floor(diff / 3600).toString().padStart(2, '0');
      const m = Math.floor((diff % 3600) / 60).toString().padStart(2, '0');
      const s = (diff % 60).toString().padStart(2, '0');
      setElapsed(`${h}:${m}:${s}`);
    };
    
    update();
    const int = setInterval(update, 1000);
    return () => clearInterval(int);
  }, [startTime]);

  return <span className="font-mono text-[11px] tracking-widest">{elapsed}</span>;
}

export default function IncidentsPage() {
  const { data: incidentsData } = useIncidents();
  const { mutate: resolve } = useResolveIncident();
  const canResolve = usePermission(PERMISSIONS.INCIDENTS_RESOLVE);
  const incidents = incidentsData?.incidents ?? [];
  
  // Filter exclusively to ACTIVE incidents
  const activeIncidents = incidents.filter(i => i.status === 'Active');

  // 🛡️ EXTRACT USER NAME FOR PERSONALIZED GREETING
  const { data: session } = useSession();
  const firstName = session?.user?.name?.split(' ')[0] || 'Commander';

  // 🛡️ DYNAMIC SIMULATION STEPS
  const PAGE_STEPS: TourStep[] = [
    {
      targetId: 'spotlight-incidents-header',
      tag: 'LIVE OVERSIGHT',
      title: 'Active Deployments',
      script: `Welcome to Live Incidents, ${firstName}. This command center provides real-time oversight of all ongoing field operations.`
    },
    {
      targetId: 'spotlight-incident-card-0',
      tag: 'MISSION TELEMETRY',
      title: 'Tactical Operation Status',
      script: 'Each active mission tracks the deployed hardware, responder status, and a live T-MINUS mission clock. Commanders can coordinate or resolve operations directly from this console. Briefing complete.'
    }
  ];

  return (
    <div className="p-6 max-w-[1400px] mx-auto min-h-screen">
      
      {/* 🛡️ TARGET 1: Header */}
      <div id="spotlight-incidents-header" className="flex justify-between items-end mb-8">
        <div>
          <p className="text-[11px] font-mono tracking-widest text-slate-400 uppercase">
            Active field operations requiring immediate oversight
          </p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold font-mono text-white">{activeIncidents.length}</div>
          <div className="text-[10px] font-mono tracking-widest text-slate-500 uppercase">Active Units</div>
        </div>
      </div>

      {/* Active Grid */}
      {activeIncidents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border border-white/5 border-dashed rounded-xl bg-white/[0.01]">
          <div className="w-3 h-3 rounded-full bg-slate-600 mb-4" />
          <div className="text-sm font-mono text-slate-400">NO ACTIVE DEPLOYMENTS</div>
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {activeIncidents.map((inc, idx) => {
              const isCritical = inc.type.includes('GSW') || inc.type.includes('Stab');
              
              return (
                <motion.div 
                  key={inc.id}
                  id={idx === 0 ? 'spotlight-incident-card-0' : undefined} /* 🛡️ TARGET 2: Highlights the very first card */
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`bg-white/[0.02] border ${isCritical ? 'border-red-500/30 bg-red-500/[0.02]' : 'border-white/10'} rounded-lg p-5 flex flex-col md:flex-row items-center gap-6 backdrop-blur-xl transition-all hover:bg-white/[0.05]`}
                >
                  {/* Status Indicator & Timer */}
                  <div className="flex flex-col items-center justify-center w-24 border-r border-white/10 pr-6">
                    <div className="text-[9px] font-mono text-slate-500 tracking-widest uppercase mb-2">T-MINUS</div>
                    <div className={`${isCritical ? 'text-red-400' : 'text-cyan-400'} font-bold`}>
                      <MissionClock startTime={inc.created_at} />
                    </div>
                  </div>

                  {/* Core Info */}
                  <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <div className="text-[9px] font-mono text-slate-500 tracking-widest uppercase mb-1">INCIDENT ID</div>
                      <div className="text-xs font-mono text-white font-bold">{inc.id}</div>
                    </div>
                    <div>
                      <div className="text-[9px] font-mono text-slate-500 tracking-widest uppercase mb-1">INJURY TYPE</div>
                      <div className={`text-xs font-mono px-2 py-0.5 rounded border inline-block ${isCritical ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-amber-500/10 border-amber-500/30 text-amber-400'}`}>
                        {inc.type}
                      </div>
                    </div>
                    <div>
                      <div className="text-[9px] font-mono text-slate-500 tracking-widest uppercase mb-1">RESPONDER</div>
                      <div className="text-xs font-mono text-slate-300">{inc.responder}</div>
                    </div>
                    <div>
                      <div className="text-[9px] font-mono text-slate-500 tracking-widest uppercase mb-1">HARDWARE</div>
                      <div className="text-xs font-mono text-slate-300">{inc.device}</div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3 pl-6 border-l border-white/10">
                    <button className="px-4 py-2 bg-white/5 border border-white/10 text-white text-[10px] font-mono rounded hover:bg-white/10 transition-colors">
                      RADIO
                    </button>
                    {canResolve && (
                      <button
                        onClick={() => resolve(inc.id)}
                        className="px-4 py-2 bg-green-500/10 border border-green-500/30 text-green-400 text-[10px] font-mono rounded hover:bg-green-500/20 transition-colors"
                      >
                        MARK RESOLVED
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* 🛡️ INJECT THE TOUR ENGINE */}
      <VoiceTour storageKey="valkyra-tour-incidents-live" steps={PAGE_STEPS} />

    </div>
  );
}