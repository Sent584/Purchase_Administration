import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from './Icon';
import { Badge } from './Badge';

export type DrawerMeta = { label: string; value: string };

export function Drawer({
  open,
  onClose,
  eyebrow,
  title,
  subtitle,
  badge,
  meta,
  children,
  widthClass = 'w-full sm:w-[70vw] sm:max-w-[70vw]',
}: {
  open: boolean;
  onClose: () => void;
  eyebrow: string;
  title: string;
  subtitle?: string;
  badge?: ReactNode;
  meta?: DrawerMeta[];
  children: ReactNode;
  /** Defaults to 70% viewport width (full width on small screens). */
  widthClass?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" className="absolute inset-0 bg-ink-900/45 backdrop-blur-[2px]" aria-label="Close drawer" onClick={onClose} />
      <aside
        className={`relative flex h-full w-full ${widthClass} animate-[slideInRight_0.28s_ease-out] flex-col bg-white shadow-2xl`}
      >
        <header className="relative shrink-0 overflow-hidden bg-gradient-to-br from-crimson-900 via-crimson-700 to-crimson-600 px-5 pb-5 pt-4 text-white">
          <div className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full bg-gold-400/20 blur-2xl" />
          <div className="pointer-events-none absolute bottom-0 left-16 h-20 w-20 rounded-full bg-white/10 blur-xl" />
          <div className="relative flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gold-200">{eyebrow}</p>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <h2 className="truncate text-xl font-semibold tracking-tight">{title}</h2>
                {badge}
              </div>
              {subtitle && <p className="mt-1 truncate text-sm text-crimson-100/90">{subtitle}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-white/20 bg-white/10 p-2 text-white hover:bg-white/20"
              aria-label="Close"
            >
              <Icon name="x" className="h-4 w-4" />
            </button>
          </div>
          {meta && meta.length > 0 && (
            <div className="relative mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {meta.map((m) => (
                <div key={m.label} className="rounded-lg border border-white/15 bg-white/10 px-3 py-2 backdrop-blur">
                  <p className="text-[10px] uppercase tracking-wide text-crimson-100/75">{m.label}</p>
                  <p className="mt-0.5 truncate text-sm font-semibold text-white">{m.value}</p>
                </div>
              ))}
            </div>
          )}
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
      </aside>
      <style>{`@keyframes slideInRight{from{transform:translateX(100%)}to{transform:translateX(0)}}`}</style>
    </div>,
    document.body,
  );
}

export function DrawerStatusBadge({ children, tone = 'gold' }: { children: ReactNode; tone?: 'gold' | 'success' | 'warning' | 'danger' | 'info' | 'neutral' }) {
  return <Badge tone={tone}>{children}</Badge>;
}
