'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchSummary, fetchSessions, fetchPatient, fetchIncidents, createIncident, resolveIncident, checkHealth } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import { useNucleusStore } from '@/store/useNucleusStore';
import { generateIncidentId } from '@/lib/utils';
import { Incident } from '@/types';

export function useSummary() {
  return useQuery({
    queryKey: queryKeys.summary,
    queryFn: fetchSummary,
    staleTime: 60_000,
    refetchInterval: 60_000,
  });
}

export function useSessions(limit = 20, offset = 0) {
  return useQuery({
    queryKey: queryKeys.sessions(limit, offset),
    queryFn: () => fetchSessions(limit, offset),
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });
}

export function useAllSessions() {
  const setAllSessions = useNucleusStore((s) => s.setAllSessions);
  return useQuery({
    queryKey: queryKeys.allSessions,
    queryFn: async () => {
      const data = await fetchSessions(100, 0);
      setAllSessions(data.sessions);
      return data;
    },
    staleTime: 60_000,
    refetchInterval: 60_000,
  });
}

export function usePatient(sessionId: string | null) {
  return useQuery({
    queryKey: queryKeys.patient(sessionId!),
    queryFn: () => fetchPatient(sessionId!),
    enabled: !!sessionId,
    staleTime: 5 * 60_000,
  });
}

export function useIncidents() {
  return useQuery({
    queryKey: queryKeys.incidents,
    queryFn: fetchIncidents,
    staleTime: 30_000,
  });
}

export function useCreateIncident() {
  const qc = useQueryClient();
  const addToast = useNucleusStore((s) => s.addToast);
  const setIncidentModalOpen = useNucleusStore((s) => s.setIncidentModalOpen);

  return useMutation({
    mutationFn: (data: Omit<Incident, 'id' | 'created_at'>) => {
      const id = generateIncidentId();
      return createIncident({ ...data, id } as any);
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: queryKeys.incidents });
      setIncidentModalOpen(false);
      addToast({ type: 'success', message: `✓ Incident deployed · ${variables.responder} dispatched` });
    },
    onError: () => {
      addToast({ type: 'error', message: 'Failed to create incident. Check API connection.' });
    },
  });
}

export function useResolveIncident() {
  const qc = useQueryClient();
  const addToast = useNucleusStore((s) => s.addToast);

  return useMutation({
    mutationFn: resolveIncident,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.incidents });
      addToast({ type: 'success', message: 'Incident marked as resolved.' });
    },
    onError: () => {
      addToast({ type: 'error', message: 'Failed to resolve incident.' });
    },
  });
}

export function useHealth() {
  return useQuery({
    queryKey: queryKeys.health,
    queryFn: checkHealth,
    staleTime: 0,
    enabled: false,
    retry: false,
  });
}
