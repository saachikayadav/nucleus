export const queryKeys = {
  summary:     ['summary'] as const,
  sessions:    (limit: number, offset: number) => ['sessions', limit, offset] as const,
  allSessions: ['sessions', 'all'] as const,
  patient:     (id: string) => ['patient', id] as const,
  incidents:   ['incidents'] as const,
  health:      ['health'] as const,
};
