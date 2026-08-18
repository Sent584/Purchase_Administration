import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Drawer } from '../../components/ui/Drawer';
import { PageSpinner, ErrorBanner } from '../../components/ui/Feedback';
import { HeroAction, PageHero } from '../../components/erp/PageHero';
import { formatInrCompact } from '../../components/erp/FeatureCatalogue';
import { feesApi, type StudentFeeFilters } from '../../lib/feesApi';
import { apiErrorMessage } from '../../lib/api';
import { useAuthStore } from '../../state/authStore';
import { FeesCharts } from './FeesCharts';
import { FeesKpiStrip } from './FeesKpiStrip';
import { FeesOrgTab } from './FeesOrgTab';
import { FeesStudentDetailDrawer } from './FeesStudentDetailDrawer';
import { FeesStudentsTab } from './FeesStudentsTab';
import { FeesTopLines } from './FeesTopLines';

type FeesDrawer = 'org' | 'students' | null;

export function FeesOverviewPage() {
  const isExec = useAuthStore((s) => s.hasPermission('reports:read'));
  const [drawer, setDrawer] = useState<FeesDrawer>(null);
  const [studentFilters, setStudentFilters] = useState<StudentFeeFilters>({});
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['fees', 'overview'],
    queryFn: () => feesApi.overview(),
  });

  if (isLoading) return <PageSpinner />;
  if (isError || !data) return <ErrorBanner message={apiErrorMessage(error)} />;

  const overduePct = data.total_pending > 0 ? Math.round((data.overdue_amount / data.total_pending) * 100) : 0;

  const openOrg = () => {
    setSelectedStudent(null);
    setDrawer('org');
  };
  const openStudents = (filters: StudentFeeFilters = {}) => {
    setStudentFilters(filters);
    setSelectedStudent(null);
    setDrawer('students');
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-10">
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-crimson-900 via-crimson-800 to-ink-900 text-white shadow-lg">
        <div className="relative px-6 py-8 sm:px-10">
          <div className="pointer-events-none absolute -right-10 top-0 h-56 w-56 rounded-full bg-gold-400/20 blur-3xl" />
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-200">Student Fees</p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-2xl">
              <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">Fees Overview & Analytics</h1>
              <p className="mt-3 text-sm leading-relaxed text-crimson-100/90 sm:text-base">
                Pending dues by programme — open org or student drill-downs in drawers (same pattern as Purchase).
              </p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 px-5 py-4 backdrop-blur">
              <p className="text-xs uppercase tracking-wide text-white/70">Outstanding book</p>
              <p className="mt-1 text-2xl font-semibold text-gold-200">{formatInrCompact(data.total_pending)}</p>
              <p className="mt-1 text-xs text-white/70">{data.student_count} students · {overduePct}% overdue</p>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            {isExec && (
              <Link to="/executive">
                <Button variant="secondary" className="border-white/20 bg-white/10 text-white hover:bg-white/20">Command Centre</Button>
              </Link>
            )}
            <Button variant="secondary" className="border-white/20 bg-white/10 text-white hover:bg-white/20" onClick={openOrg}>
              Campus / Division / Batch
            </Button>
            <Button className="bg-gold-500 text-ink-900 hover:bg-gold-400" onClick={() => openStudents()}>
              Student-wise dues
            </Button>
          </div>
        </div>
      </section>

      <PageHero
        eyebrow="Collections intelligence"
        title="Where dues concentrate"
        subtitle="Programme, year, fee category and due timeline. Use drawers for org hierarchy and student ledgers."
        actions={<HeroAction to="/accounts/vouchers">Fee receipts (vouchers)</HeroAction>}
      />
      <FeesKpiStrip data={data} />
      <FeesCharts data={data} />
      <FeesTopLines lines={data.top_lines} />

      <Drawer
        open={drawer === 'org'}
        onClose={() => setDrawer(null)}
        eyebrow="Org drill-down"
        title="Fees by Campus / Division / Dept / Batch"
        subtitle="Click a row to open matching students"
        meta={[
          { label: 'Pending', value: formatInrCompact(data.total_pending) },
          { label: 'Campuses', value: String(data.by_campus.length) },
          { label: 'Batches', value: String(data.by_batch.length) },
        ]}
      >
        <FeesOrgTab data={data} onDrillStudents={(f) => openStudents(f)} />
      </Drawer>

      <Drawer
        open={drawer === 'students' && !selectedStudent}
        onClose={() => setDrawer(null)}
        eyebrow="Student-wise fees"
        title="Students with pending dues"
        subtitle="Filter by campus, division, department or batch"
        meta={[
          { label: 'Students', value: String(data.student_count) },
          { label: 'Pending', value: formatInrCompact(data.total_pending) },
        ]}
      >
        <FeesStudentsTab
          overview={data}
          filters={studentFilters}
          setFilters={setStudentFilters}
          onSelectStudent={setSelectedStudent}
        />
      </Drawer>

      <FeesStudentDetailDrawer studentId={selectedStudent} onClose={() => setSelectedStudent(null)} />
    </div>
  );
}
