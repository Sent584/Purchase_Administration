import type { IndentLineInput, IndentOut, IndentPriority, IndentPurpose } from '../../types/purchase';

export function prStatusTone(status: string) {
  if (status === 'approved') return 'success' as const;
  if (status === 'rejected') return 'danger' as const;
  if (status === 'submitted') return 'warning' as const;
  return 'neutral' as const;
}

export function prPriorityTone(priority: string) {
  if (priority === 'urgent') return 'danger' as const;
  if (priority === 'high') return 'warning' as const;
  if (priority === 'low') return 'neutral' as const;
  return 'info' as const;
}

export function formatPrDate(value: string | null | undefined): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function toDateInput(value: string | null | undefined): string {
  if (!value) return '';
  return value.slice(0, 10);
}

export type RequisitionFormState = {
  campus_id: string;
  division_id: string;
  department_id: string;
  requested_by_name: string;
  requested_by_email: string;
  purpose: IndentPurpose;
  priority: IndentPriority;
  requisition_date: string;
  required_by_date: string;
  delivery_location: string;
  budget_head: string;
  justification: string;
  remarks: string;
  attachment_name: string;
  lines: IndentLineInput[];
};

export function emptyLine(): IndentLineInput {
  return {
    item_id: null,
    item_name: '',
    description: '',
    specification: '',
    quantity: 1,
    uom: 'Nos',
    estimated_rate: 0,
  };
}

export function emptyForm(defaults?: Partial<RequisitionFormState>): RequisitionFormState {
  const today = new Date().toISOString().slice(0, 10);
  return {
    campus_id: '',
    division_id: '',
    department_id: '',
    requested_by_name: '',
    requested_by_email: '',
    purpose: 'lab',
    priority: 'medium',
    requisition_date: today,
    required_by_date: '',
    delivery_location: '',
    budget_head: '',
    justification: '',
    remarks: '',
    attachment_name: '',
    lines: [emptyLine()],
    ...defaults,
  };
}

export function formFromIndent(pr: IndentOut): RequisitionFormState {
  return {
    campus_id: pr.campus_id,
    division_id: pr.division_id || '',
    department_id: pr.department_id,
    requested_by_name: pr.requested_by_name,
    requested_by_email: pr.requested_by_email,
    purpose: pr.purpose,
    priority: pr.priority,
    requisition_date: toDateInput(pr.requisition_date ?? pr.created_at),
    required_by_date: toDateInput(pr.required_by_date),
    delivery_location: pr.delivery_location || '',
    budget_head: pr.budget_head || '',
    justification: pr.justification || pr.remarks || '',
    remarks: pr.remarks || '',
    attachment_name: '',
    lines: pr.lines.map((l) => ({
      item_id: l.item_id,
      item_name: l.item_name || l.description,
      description: l.description || l.specification,
      specification: l.specification || l.description,
      quantity: l.quantity,
      uom: l.uom,
      estimated_rate: l.estimated_rate,
    })),
  };
}

export function lineTotal(line: IndentLineInput): number {
  return Math.round(line.quantity * line.estimated_rate * 100) / 100;
}

export function formTotal(lines: IndentLineInput[]): number {
  return Math.round(lines.reduce((sum, l) => sum + lineTotal(l), 0) * 100) / 100;
}
