import clsx from 'clsx';

type Tone = 'success' | 'warning' | 'danger' | 'neutral' | 'info' | 'gold';

const toneClasses: Record<Tone, string> = {
  success: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  warning: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  danger: 'bg-red-50 text-red-700 ring-red-600/20',
  neutral: 'bg-ink-100 text-ink-600 ring-ink-500/20',
  info: 'bg-sky-50 text-sky-700 ring-sky-600/20',
  gold: 'bg-gold-100 text-gold-800 ring-gold-500/30',
};

export function Badge({ tone = 'neutral', children }: { tone?: Tone; children: React.ReactNode }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
        toneClasses[tone],
      )}
    >
      {children}
    </span>
  );
}
