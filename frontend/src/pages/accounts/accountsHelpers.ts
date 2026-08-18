export function voucherStatusTone(status: string) {
  if (status === 'posted') return 'success' as const;
  if (status === 'reversed') return 'danger' as const;
  if (status === 'approved' || status === 'validated') return 'info' as const;
  return 'neutral' as const;
}

export function formatInr(n: number): string {
  return `₹${n.toLocaleString('en-IN')}`;
}
