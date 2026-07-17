'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Session, Toast, TriageCategory } from '@/types';
import { DeviceAssignments, getDefaultAssignments } from '@/lib/deviceAssignments';

interface NucleusStore {
  // Cached sessions
  allSessions: Session[];
  setAllSessions: (s: Session[]) => void;

  // Active patient modal
  activePatientId: string | null;
  setActivePatientId: (id: string | null) => void;

  // Incident modal
  incidentModalOpen: boolean;
  setIncidentModalOpen: (v: boolean) => void;

  // Filters
  triageFilter: 'all' | TriageCategory;
  setTriageFilter: (f: 'all' | TriageCategory) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;

  // Settings (persisted)
  refreshInterval: number;
  setRefreshInterval: (n: number) => void;
  sessionsPerPage: number;
  setSessionsPerPage: (n: number) => void;

  // Toasts
  toasts: Toast[];
  addToast: (t: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;

  // Device ↔ responder assignments (persisted)
  deviceAssignments: DeviceAssignments;
  assignDevice: (deviceId: string, responderId: string) => void;
  unassignDevice: (deviceId: string) => void;
}

export const useNucleusStore = create<NucleusStore>()(
  persist(
    (set) => ({
      allSessions: [],
      setAllSessions: (s) => set({ allSessions: s }),

      activePatientId: null,
      setActivePatientId: (id) => set({ activePatientId: id }),

      incidentModalOpen: false,
      setIncidentModalOpen: (v) => set({ incidentModalOpen: v }),

      triageFilter: 'all',
      setTriageFilter: (f) => set({ triageFilter: f }),
      searchQuery: '',
      setSearchQuery: (q) => set({ searchQuery: q }),

      refreshInterval: 60000,
      setRefreshInterval: (n) => set({ refreshInterval: n }),
      sessionsPerPage: 20,
      setSessionsPerPage: (n) => set({ sessionsPerPage: n }),

      toasts: [],
      addToast: (t) =>
        set((state) => ({
          toasts: [...state.toasts, { ...t, id: Date.now().toString() }],
        })),
      removeToast: (id) =>
        set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),

      deviceAssignments: getDefaultAssignments(),
      assignDevice: (deviceId, responderId) =>
        set((state) => {
          const next: DeviceAssignments = {};
          Object.entries(state.deviceAssignments).forEach(([dId, rId]) => {
            next[dId] = rId === responderId ? null : rId;
          });
          next[deviceId] = responderId;
          return { deviceAssignments: next };
        }),
      unassignDevice: (deviceId) =>
        set((state) => ({ deviceAssignments: { ...state.deviceAssignments, [deviceId]: null } })),
    }),
    {
      name: 'nucleus-store',
      partialize: (state) => ({
        refreshInterval: state.refreshInterval,
        sessionsPerPage: state.sessionsPerPage,
        triageFilter: state.triageFilter,
        deviceAssignments: state.deviceAssignments,
      }),
    }
  )
);
