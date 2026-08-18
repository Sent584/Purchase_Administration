export function attStatusTone(status: string) {
  if (status === 'present' || status === 'on_duty') return 'success' as const;
  if (status === 'absent') return 'danger' as const;
  if (status === 'half_day' || status === 'leave') return 'warning' as const;
  return 'neutral' as const;
}

export function leaveStatusTone(status: string) {
  if (status === 'approved') return 'success' as const;
  if (status === 'rejected' || status === 'cancelled') return 'danger' as const;
  if (status === 'submitted') return 'warning' as const;
  return 'neutral' as const;
}

export function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}
