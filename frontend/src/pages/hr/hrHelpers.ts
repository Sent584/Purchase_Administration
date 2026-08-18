export function empStatusTone(status: string) {
  if (status === 'active') return 'success' as const;
  if (status === 'on_leave') return 'warning' as const;
  if (status === 'terminated') return 'danger' as const;
  return 'neutral' as const;
}

export function formatDate(value: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function rankLabel(rank: string | null): string {
  if (!rank) return '—';
  return rank.replace(/_/g, ' ');
}
