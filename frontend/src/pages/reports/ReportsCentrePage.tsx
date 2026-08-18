import { Link } from 'react-router-dom';
import { Card, CardBody, CardHeader, CardTitle } from '../../components/ui/Card';
import { Icon } from '../../components/ui/Icon';
import { PageHero } from '../../components/erp/PageHero';
import { FeatureCatalogue } from '../../components/erp/FeatureCatalogue';
import { useAuthStore } from '../../state/authStore';
import { REPORT_CATEGORIES, REPORTS, REPORTS_FEATURES, type ReportCategory } from './reportsCatalogue';

export function ReportsCentrePage() {
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const visible = REPORTS.filter((r) => hasPermission(r.permission));

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHero
        eyebrow="Analytics"
        title="Reports & Analytics"
        subtitle="Unified report centre for Sasurie Group — amounts in Indian numbering; exports watermarked and logged."
      />

      <FeatureCatalogue title="Report centre capabilities" items={REPORTS_FEATURES} />

      {REPORT_CATEGORIES.map((category: ReportCategory) => {
        const items = visible.filter((r) => r.category === category);
        if (items.length === 0) return null;
        return (
          <Card key={category}>
            <CardHeader>
              <CardTitle>{category}</CardTitle>
            </CardHeader>
            <CardBody className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {items.map((r) => (
                <Link
                  key={r.path + r.title}
                  to={r.path}
                  className="flex gap-3 rounded-lg border border-ink-100 bg-ink-50/60 p-3 transition hover:border-crimson-200 hover:bg-white"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-crimson-700 shadow-sm">
                    <Icon name={r.icon} className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-ink-900">{r.title}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-ink-500">{r.description}</p>
                  </div>
                </Link>
              ))}
            </CardBody>
          </Card>
        );
      })}

      {visible.length === 0 && (
        <p className="text-sm text-ink-400">No reports available for your permissions.</p>
      )}
    </div>
  );
}
