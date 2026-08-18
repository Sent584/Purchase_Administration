import clsx from 'clsx';
import { Icon } from '../ui/Icon';

export interface TimelineStep {
  label: string;
  status: 'done' | 'current' | 'pending' | 'rejected';
  actor?: string | null;
  timestamp?: string | null;
  notes?: string | null;
}

const dotClasses: Record<TimelineStep['status'], string> = {
  done: 'bg-emerald-500 text-white',
  current: 'bg-crimson-600 text-white ring-4 ring-crimson-100',
  pending: 'bg-ink-100 text-ink-400',
  rejected: 'bg-red-500 text-white',
};

export function ApprovalTimeline({ steps }: { steps: TimelineStep[] }) {
  return (
    <ol className="flex flex-col">
      {steps.map((step, idx) => (
        <li key={idx} className="relative flex gap-3 pb-6 last:pb-0">
          {idx < steps.length - 1 && (
            <span className={clsx('absolute left-[11px] top-6 h-full w-px', step.status === 'done' ? 'bg-emerald-300' : 'bg-ink-200')} />
          )}
          <span className={clsx('flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold', dotClasses[step.status])}>
            {step.status === 'done' ? <Icon name="check" className="h-3.5 w-3.5" /> : step.status === 'rejected' ? <Icon name="x" className="h-3.5 w-3.5" /> : idx + 1}
          </span>
          <div className="pt-0.5">
            <p className={clsx('text-sm font-medium', step.status === 'pending' ? 'text-ink-400' : 'text-ink-900')}>{step.label}</p>
            {(step.actor || step.timestamp) && (
              <p className="text-xs text-ink-500">
                {step.actor}
                {step.actor && step.timestamp && ' · '}
                {step.timestamp && new Date(step.timestamp).toLocaleString('en-IN')}
              </p>
            )}
            {step.notes && <p className="mt-0.5 text-xs italic text-ink-500">"{step.notes}"</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}
