import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../ui/Icon';
import { Card, CardBody, CardHeader, CardTitle } from '../ui/Card';

type IconName = Parameters<typeof Icon>[0]['name'];

export interface FeatureItem {
  icon: IconName;
  title: string;
  description: string;
}

export function FeatureCatalogue({ title, items }: { title: string; items: FeatureItem[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardBody className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <div key={item.title} className="flex gap-3 rounded-lg border border-ink-100 bg-ink-50/60 p-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-crimson-700 shadow-sm">
              <Icon name={item.icon} className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-medium text-ink-900">{item.title}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-ink-500">{item.description}</p>
            </div>
          </div>
        ))}
      </CardBody>
    </Card>
  );
}

export function ExceptionPanel({
  title,
  empty,
  children,
}: {
  title: string;
  empty?: string;
  children?: ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardBody className="flex flex-col gap-3">
        {children ?? <p className="text-sm text-ink-400">{empty ?? 'Nothing requiring attention.'}</p>}
      </CardBody>
    </Card>
  );
}

export function QuickLinks({ links }: { links: { to: string; label: string; hint: string }[] }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {links.map((l) => (
        <Link
          key={l.to}
          to={l.to}
          className="group rounded-xl border border-ink-200 bg-white p-4 shadow-sm transition hover:border-crimson-200 hover:shadow-md"
        >
          <p className="text-sm font-semibold text-ink-900 group-hover:text-crimson-700">{l.label}</p>
          <p className="mt-1 text-xs text-ink-500">{l.hint}</p>
        </Link>
      ))}
    </div>
  );
}

export function formatInr(n: number): string {
  return `₹${n.toLocaleString('en-IN')}`;
}

export function formatInrCompact(n: number): string {
  if (n >= 1_00_00_000) return `₹${(n / 1_00_00_000).toFixed(2)} Cr`;
  if (n >= 1_00_000) return `₹${(n / 1_00_000).toFixed(2)} L`;
  return formatInr(n);
}
