import clsx from 'clsx';
import { Icon } from '../ui/Icon';

export interface WorkflowStep {
  label: string;
  description?: string;
  status?: 'done' | 'current' | 'upcoming';
  count?: number | string;
}

export function WorkflowStrip({ title, steps }: { title?: string; steps: WorkflowStep[] }) {
  return (
    <div className="rounded-xl border border-ink-200 bg-white p-5 shadow-sm">
      {title && <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-ink-400">{title}</p>}
      <ol className="flex flex-col gap-3 lg:flex-row lg:items-stretch lg:gap-0">
        {steps.map((step, idx) => {
          const status = step.status ?? 'upcoming';
          return (
            <li key={step.label} className="relative flex flex-1 gap-3 lg:flex-col lg:px-2">
              {idx < steps.length - 1 && (
                <span className="absolute left-[15px] top-8 hidden h-px w-[calc(100%-8px)] translate-x-4 bg-ink-200 lg:block" />
              )}
              <span
                className={clsx(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                  status === 'done' && 'bg-emerald-500 text-white',
                  status === 'current' && 'bg-crimson-600 text-white ring-4 ring-crimson-100',
                  status === 'upcoming' && 'bg-ink-100 text-ink-500',
                )}
              >
                {status === 'done' ? <Icon name="check" className="h-4 w-4" /> : idx + 1}
              </span>
              <div className="min-w-0 pb-1 lg:pt-2">
                <p className={clsx('text-sm font-semibold', status === 'upcoming' ? 'text-ink-500' : 'text-ink-900')}>
                  {step.label}
                  {step.count !== undefined && (
                    <span className="ml-2 rounded-full bg-ink-100 px-2 py-0.5 text-[10px] font-medium text-ink-600">
                      {step.count}
                    </span>
                  )}
                </p>
                {step.description && <p className="mt-0.5 text-xs leading-relaxed text-ink-500">{step.description}</p>}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
