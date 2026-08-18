import { Icon } from '../../components/ui/Icon';
import { FeatureCatalogue, QuickLinks } from '../../components/erp/FeatureCatalogue';
import type { FeatureItem } from '../../components/erp/FeatureCatalogue';
import type { RoleHomeDashboard } from '../../types/roleHome';
import { KpiTile } from '../../components/erp/PageHero';
import { ActionInbox } from './ActionInbox';
import { AnalyticsBars } from './AnalyticsBars';

const TONE: Record<string, string> = {
  crimson: 'bg-crimson-50 text-crimson-700',
  gold: 'bg-gold-100 text-gold-700',
  sky: 'bg-sky-50 text-sky-700',
  amber: 'bg-amber-50 text-amber-700',
  emerald: 'bg-emerald-50 text-emerald-700',
  ink: 'bg-ink-100 text-ink-600',
};

const ICON_MAP: Record<string, FeatureItem['icon']> = {
  chart: 'chart',
  users: 'users',
  wallet: 'wallet',
  shield: 'shield',
  clock: 'clock',
  file: 'file',
  box: 'box',
  cart: 'cart',
  server: 'server',
  building: 'building',
};

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export function RoleHomeView({ data }: { data: RoleHomeDashboard }) {
  const insights: FeatureItem[] = data.insights.map((i) => ({
    icon: ICON_MAP[i.icon] ?? 'chart',
    title: i.title,
    description: i.description,
  }));

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-crimson-800 via-crimson-700 to-crimson-600 text-white shadow-sm">
        <div className="relative px-6 py-6 sm:px-8 sm:py-8">
          <div className="pointer-events-none absolute -right-8 -top-10 h-40 w-40 rounded-full bg-gold-400/15 blur-2xl" />
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold-200">{data.eyebrow}</p>
          <p className="mt-2 text-sm text-crimson-100/80">
            {greeting()}, {data.greeting_name}
          </p>
          <div className="mt-1 flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-2xl">
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{data.title}</h1>
              <p className="mt-2 text-sm text-crimson-100/90">{data.subtitle}</p>
              <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-gold-100">
                <Icon name="shield" className="h-3.5 w-3.5" />
                {data.role_label}
              </p>
            </div>
            {data.highlight_value && (
              <div className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur">
                <p className="text-[11px] uppercase tracking-wide text-crimson-100/80">{data.highlight_label}</p>
                <p className="mt-1 text-2xl font-semibold text-white">{data.highlight_value}</p>
                {data.highlight_hint && <p className="mt-1 text-xs text-crimson-100/75">{data.highlight_hint}</p>}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        {data.kpis.map((k) => (
          <KpiTile
            key={k.key}
            icon="chart"
            label={k.label}
            value={k.value}
            sub={k.sub ?? undefined}
            tone={TONE[k.tone] ?? TONE.crimson}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <AnalyticsBars title={data.series_title} unit={data.series_unit} series={data.series} />
        </div>
        <div className="lg:col-span-2">
          <ActionInbox actions={data.actions} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <FeatureCatalogue title="Role insights" items={insights} />
        </div>
        <div>
          <h2 className="mb-3 text-sm font-semibold text-ink-900">Focus areas</h2>
          <QuickLinks links={data.quick_links} />
        </div>
      </div>
    </div>
  );
}
