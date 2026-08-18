export interface TaxableLine {
  gst_rate: number;
  taxable_amount: number;
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
}

export interface TaxTotalRow {
  label: string;
  amount: number;
}

export function formatInr(n: number): string {
  return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Build CGST/SGST/IGST rows with rate % for the document totals block. */
export function buildTaxTotalRows(lines: TaxableLine[]): TaxTotalRow[] {
  const cgst = new Map<number, number>();
  const sgst = new Map<number, number>();
  const igst = new Map<number, number>();

  for (const line of lines) {
    const half = round2(line.gst_rate / 2);
    if (line.cgst_amount > 0) cgst.set(half, round2((cgst.get(half) ?? 0) + line.cgst_amount));
    if (line.sgst_amount > 0) sgst.set(half, round2((sgst.get(half) ?? 0) + line.sgst_amount));
    if (line.igst_amount > 0) igst.set(line.gst_rate, round2((igst.get(line.gst_rate) ?? 0) + line.igst_amount));
  }

  const rows: TaxTotalRow[] = [];
  const pushSorted = (prefix: string, map: Map<number, number>) => {
    [...map.entries()]
      .sort((a, b) => a[0] - b[0])
      .forEach(([rate, amount]) => rows.push({ label: `${prefix} @ ${rate}%`, amount }));
  };
  pushSorted('CGST', cgst);
  pushSorted('SGST', sgst);
  pushSorted('IGST', igst);
  return rows;
}

export function sumTax(lines: TaxableLine[]): number {
  return round2(lines.reduce((s, l) => s + l.cgst_amount + l.sgst_amount + l.igst_amount, 0));
}
