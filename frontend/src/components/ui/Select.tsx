import { type SelectHTMLAttributes, forwardRef, useId } from 'react';
import clsx from 'clsx';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(({ label, hint, className, id, children, ...props }, ref) => {
  const autoId = useId();
  const selectId = id ?? autoId;
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={selectId} className="text-sm font-medium text-ink-700">
          {label}
        </label>
      )}
      <select
        ref={ref}
        id={selectId}
        className={clsx(
          'rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900',
          'focus:outline-none focus:ring-2 focus:ring-crimson-500/40 focus:border-crimson-500',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      {hint && <p className="text-xs text-ink-500">{hint}</p>}
    </div>
  );
});
Select.displayName = 'Select';
