export function runStatusTone(status: string) {
  if (status === 'locked' || status === 'posted' || status === 'approved') return 'success' as const;
  if (status === 'review' || status === 'processing') return 'warning' as const;
  return 'neutral' as const;
}

export function monthName(month: number): string {
  return new Date(2000, month - 1, 1).toLocaleString('en-IN', { month: 'long' });
}

export function formatInr(n: number): string {
  return `₹${n.toLocaleString('en-IN')}`;
}
