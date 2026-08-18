import { Link } from 'react-router-dom';
import { Badge } from '../../components/ui/Badge';
import { Card, CardBody, CardHeader, CardTitle } from '../../components/ui/Card';
import type { HomeAction } from '../../types/roleHome';

const urgencyTone: Record<string, 'danger' | 'warning' | 'gold' | 'neutral'> = {
  high: 'danger',
  medium: 'warning',
  low: 'neutral',
};

export function ActionInbox({ actions }: { actions: HomeAction[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Action inbox</CardTitle>
      </CardHeader>
      <CardBody className="space-y-3">
        {actions.length === 0 ? (
          <p className="text-sm text-ink-400">Nothing queued for your role.</p>
        ) : (
          actions.map((a) => (
            <Link
              key={`${a.href}-${a.title}`}
              to={a.href}
              className="flex items-start justify-between gap-3 rounded-lg border border-ink-100 bg-ink-50/50 px-3 py-2.5 transition hover:border-crimson-200 hover:bg-white"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-ink-900">{a.title}</p>
                  {a.badge && <Badge tone="gold">{a.badge}</Badge>}
                </div>
                <p className="mt-0.5 text-xs text-ink-500">{a.detail}</p>
              </div>
              <Badge tone={urgencyTone[a.urgency] ?? 'neutral'}>{a.urgency}</Badge>
            </Link>
          ))
        )}
      </CardBody>
    </Card>
  );
}
