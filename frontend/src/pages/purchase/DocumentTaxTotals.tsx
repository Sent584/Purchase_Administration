import { buildTaxTotalRows, formatInr, sumTax, type TaxableLine } from './taxSummary';

export function DocumentTaxTotals({
  lines,
  taxableAmount,
  grandTotal,
  grandLabel = 'Grand Total',
  extraRows,
}: {
  lines: TaxableLine[];
  taxableAmount: number;
  grandTotal: number;
  grandLabel?: string;
  extraRows?: { label: string; amount: number; tone?: 'danger' | 'muted' }[];
}) {
  const taxRows = buildTaxTotalRows(lines);
  const totalGst = sumTax(lines);

  return (
    <div className="mt-3 ml-auto w-full max-w-xs space-y-1 text-sm">
      <div className="flex justify-between text-ink-600">
        <span>Taxable value</span>
        <span>{formatInr(taxableAmount)}</span>
      </div>
      {taxRows.map((row) => (
        <div key={row.label} className="flex justify-between text-ink-600">
          <span>{row.label}</span>
          <span>{formatInr(row.amount)}</span>
        </div>
      ))}
      {taxRows.length > 0 && (
        <div className="flex justify-between text-ink-600">
          <span>Total GST</span>
          <span>{formatInr(totalGst)}</span>
        </div>
      )}
      {extraRows?.map((row) => (
        <div
          key={row.label}
          className={`flex justify-between ${row.tone === 'danger' ? 'text-red-600' : 'text-ink-600'}`}
        >
          <span>{row.label}</span>
          <span>{row.tone === 'danger' ? `− ${formatInr(row.amount)}` : formatInr(row.amount)}</span>
        </div>
      ))}
      <div className="flex justify-between border-t border-ink-200 pt-1 text-base font-semibold text-ink-900">
        <span>{grandLabel}</span>
        <span>{formatInr(grandTotal)}</span>
      </div>
    </div>
  );
}
