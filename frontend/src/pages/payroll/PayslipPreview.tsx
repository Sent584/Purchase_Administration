import { Badge } from '../../components/ui/Badge';
import { DocumentDisclaimer, DocumentFooter, DocumentHeader } from '../../components/documents/DocumentLetterhead';
import type { PayslipOut } from '../../types/payroll';
import { formatInr } from './payrollHelpers';

export function PayslipPreview({ slip }: { slip: PayslipOut }) {
  const earningEntries = Object.entries(slip.earnings);
  const deductionEntries = Object.entries(slip.deductions);
  const employerEntries = Object.entries(slip.employer);

  return (
    <div className="rounded-xl border-2 border-crimson-600/20 bg-white p-5">
      <DocumentHeader
        institutionId={slip.institution_id}
        documentTitle="Payslip"
        documentNumber={`${slip.employee_code}-${slip.id.slice(-6)}`}
        statusNode={<Badge tone={slip.status === 'final' ? 'success' : 'neutral'}>{slip.status}</Badge>}
      />
      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <div>
          <p className="font-medium text-ink-900">{slip.employee_name}</p>
          <p className="text-xs text-ink-500">{slip.employee_code} · {slip.designation}</p>
          <p className="text-xs text-ink-400">{slip.department}</p>
        </div>
        <div className="text-right text-xs text-ink-500">
          <p>Days paid: {slip.days_paid}</p>
          <p>LOP: {slip.lop_days}</p>
          <p>Bank ****{slip.bank_last4}</p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase text-ink-400">Earnings</p>
          {earningEntries.map(([k, v]) => (
            <div key={k} className="flex justify-between py-0.5"><span className="text-ink-600">{k}</span><span>{formatInr(v)}</span></div>
          ))}
          <div className="mt-1 flex justify-between border-t border-ink-100 pt-1 font-medium"><span>Gross</span><span>{formatInr(slip.gross)}</span></div>
        </div>
        <div>
          <p className="mb-1 text-xs font-semibold uppercase text-ink-400">Deductions</p>
          {deductionEntries.map(([k, v]) => (
            <div key={k} className="flex justify-between py-0.5"><span className="text-ink-600">{k}</span><span>{formatInr(v)}</span></div>
          ))}
          <div className="mt-1 flex justify-between border-t border-ink-100 pt-1 font-medium"><span>Total</span><span>{formatInr(slip.total_deductions)}</span></div>
        </div>
      </div>
      {employerEntries.length > 0 && (
        <div className="mt-3 rounded-lg bg-ink-50/80 p-3 text-sm">
          <p className="mb-1 text-xs font-semibold uppercase text-ink-400">Employer contributions</p>
          {employerEntries.map(([k, v]) => (
            <div key={k} className="flex justify-between py-0.5"><span className="text-ink-600">{k}</span><span>{formatInr(v)}</span></div>
          ))}
        </div>
      )}
      <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
        <div className="rounded-lg border border-ink-100 p-2"><p className="text-ink-400">YTD Gross</p><p className="font-semibold text-ink-900">{formatInr(slip.ytd_gross)}</p></div>
        <div className="rounded-lg border border-ink-100 p-2"><p className="text-ink-400">YTD Tax</p><p className="font-semibold text-ink-900">{formatInr(slip.ytd_tax)}</p></div>
      </div>
      <p className="mt-4 text-center text-lg font-semibold text-crimson-700">Net Pay {formatInr(slip.net)}</p>
      <DocumentFooter documentType="PAYSLIP" documentNumber={slip.employee_code} />
      <p className="mt-2 text-center text-[10px] text-ink-400">
        Bank A/c masked (****{slip.bank_last4}). Full account numbers are never shown on payslip previews.
      </p>
      <DocumentDisclaimer />
    </div>
  );
}
