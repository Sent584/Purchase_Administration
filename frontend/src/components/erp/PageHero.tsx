import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../ui/Icon';

type IconName = Parameters<typeof Icon>[0]['name'];

export function PageHero({
  eyebrow,
  title,
  subtitle,
  actions,
}: {
  eyebrow?: string;
  title: string;
  subtitle: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-crimson-800 via-crimson-700 to-crimson-600 text-white shadow-sm">
      <div className="relative px-6 py-6 sm:px-8 sm:py-7">
        <div className="pointer-events-none absolute -right-8 -top-10 h-40 w-40 rounded-full bg-gold-400/15 blur-2xl" />
        <div className="pointer-events-none absolute bottom-0 right-24 h-24 w-24 rounded-full bg-white/10 blur-xl" />
        {eyebrow && <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold-200">{eyebrow}</p>}
        <div className="mt-1 flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
            <p className="mt-2 text-sm text-crimson-100/90">{subtitle}</p>
          </div>
          {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
        </div>
      </div>
    </div>
  );
}

export function HeroAction({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link
      to={to}
      className="rounded-lg border border-white/25 bg-white/10 px-3 py-2 text-sm font-medium text-white backdrop-blur hover:bg-white/20"
    >
      {children}
    </Link>
  );
}

export function KpiTile({
  icon,
  label,
  value,
  tone,
  sub,
}: {
  icon: IconName;
  label: string;
  value: string;
  tone: string;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border border-ink-200 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tone}`}>
          <Icon name={icon} className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-xl font-semibold text-ink-900">{value}</p>
          <p className="text-xs text-ink-500">{label}</p>
          {sub && <p className="mt-0.5 text-[11px] text-ink-400">{sub}</p>}
        </div>
      </div>
    </div>
  );
}
