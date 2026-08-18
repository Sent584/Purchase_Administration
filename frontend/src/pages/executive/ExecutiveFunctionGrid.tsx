import { Link } from 'react-router-dom';
import { Badge } from '../../components/ui/Badge';
import { Card, CardBody } from '../../components/ui/Card';
import type { FunctionPulse } from '../../types/executive';

const TONE: Record<string, string> = {
  crimson: 'from-crimson-700 to-crimson-900',
  gold: 'from-amber-700 to-amber-900',
  sky: 'from-sky-700 to-sky-900',
  emerald: 'from-emerald-700 to-emerald-900',
  amber: 'from-orange-700 to-orange-900',
  ink: 'from-ink-700 to-ink-900',
};

export function ExecutiveFunctionGrid({ functions }: { functions: FunctionPulse[] }) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="font-heading text-xl font-semibold text-ink-900">Functional pulse</h2>
        <p className="text-sm text-ink-500">Live snapshot across Purchase, People, Finance, Student Fees, Stores, Assets and Payroll.</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {functions.map((fn) => (
          <Link
            key={fn.key}
            to={fn.href}
            className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${TONE[fn.tone] ?? TONE.crimson} p-5 text-white shadow-sm transition hover:scale-[1.01]`}
          >
            <div className="pointer-events-none absolute -right-6 -top-8 h-28 w-28 rounded-full bg-white/10 blur-2xl" />
            <div className="flex items-start justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/70">{fn.label}</p>
              <Badge tone="gold">Open</Badge>
            </div>
            <p className="mt-3 text-2xl font-semibold tracking-tight">{fn.primary}</p>
            <p className="mt-2 text-sm text-white/80">{fn.secondary}</p>
            <Card className="mt-4 border-0 bg-white/10 shadow-none">
              <CardBody className="py-2 text-xs text-white/70 group-hover:text-white">
                Drill into {fn.label.toLowerCase()} details →
              </CardBody>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
