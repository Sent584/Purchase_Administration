import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '../../components/ui/Button';
import { TextField } from '../../components/ui/TextField';
import { Select } from '../../components/ui/Select';
import { ErrorBanner } from '../../components/ui/Feedback';
import { indentApi } from '../../lib/purchaseApi';
import { orgApi } from '../../lib/orgApi';
import { apiErrorMessage } from '../../lib/api';
import type { IndentOut, IndentPriority, IndentPurpose } from '../../types/purchase';
import {
  emptyForm,
  emptyLine,
  formFromIndent,
  formTotal,
  lineTotal,
  type RequisitionFormState,
} from './requisitionHelpers';

export function RequisitionForm({
  institutionId,
  editing,
  onClose,
}: {
  institutionId: string;
  editing?: IndentOut | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const { data: campuses } = useQuery({
    queryKey: ['org', 'campuses', institutionId],
    queryFn: () => orgApi.listCampuses(institutionId),
  });
  const [form, setForm] = useState<RequisitionFormState>(() =>
    editing ? formFromIndent(editing) : emptyForm(),
  );
  const { data: units } = useQuery({
    queryKey: ['org', 'units', form.campus_id],
    queryFn: () => orgApi.listOrgUnits(form.campus_id),
    enabled: !!form.campus_id,
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editing) setForm(formFromIndent(editing));
  }, [editing]);

  const mutation = useMutation({
    mutationFn: async () => {
      const lines = form.lines.map((l) => ({
        ...l,
        description: l.specification || l.item_name,
        specification: l.specification || l.item_name,
      }));
      const payload = {
        institution_id: institutionId,
        campus_id: form.campus_id,
        department_id: form.department_id,
        division_id: form.division_id || null,
        requested_by_name: form.requested_by_name,
        requested_by_email: form.requested_by_email,
        purpose: form.purpose,
        priority: form.priority,
        requisition_date: form.requisition_date ? new Date(form.requisition_date).toISOString() : null,
        required_by_date: form.required_by_date ? new Date(form.required_by_date).toISOString() : null,
        delivery_location: form.delivery_location,
        budget_head: form.budget_head,
        justification: form.justification,
        remarks: form.justification || form.remarks,
        lines,
        attachments: form.attachment_name
          ? [{ name: form.attachment_name, doc_type: 'quotation_reference' }]
          : [],
      };
      if (editing) {
        const { institution_id: _, attachments: __, ...patch } = payload;
        return indentApi.update(editing.id, patch);
      }
      return indentApi.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase', 'indents'] });
      onClose();
    },
    onError: (err) => setError(apiErrorMessage(err)),
  });

  function patchLine(idx: number, patch: Partial<RequisitionFormState['lines'][number]>) {
    setForm({ ...form, lines: form.lines.map((l, i) => (i === idx ? { ...l, ...patch } : l)) });
  }

  return (
    <div className="flex flex-col gap-5">
      {error && <ErrorBanner message={error} />}
      <section>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-400">Basic information</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <TextField label="PR No." value={editing?.indent_number ?? 'Auto-generated on save'} disabled />
          <TextField label="Requisition date" type="date" value={form.requisition_date} onChange={(e) => setForm({ ...form, requisition_date: e.target.value })} />
          <Select label="Campus" value={form.campus_id} onChange={(e) => setForm({ ...form, campus_id: e.target.value, division_id: '', department_id: '' })}>
            <option value="">Select campus</option>
            {campuses?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
          <Select
            label="Division"
            value={form.division_id}
            disabled={!form.campus_id}
            onChange={(e) => setForm({ ...form, division_id: e.target.value, department_id: '' })}
          >
            <option value="">Select division</option>
            {units?.filter((u) => u.unit_type === 'division').map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </Select>
          <Select
            label="Department"
            value={form.department_id}
            disabled={!form.campus_id}
            onChange={(e) => setForm({ ...form, department_id: e.target.value })}
          >
            <option value="">Select department</option>
            {units
              ?.filter((u) => u.unit_type === 'department' || u.unit_type === 'office' || u.unit_type === 'store' || u.unit_type === 'laboratory')
              .filter((u) => !form.division_id || u.parent_id === form.division_id)
              .map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
          </Select>
          <TextField label="Requested by" value={form.requested_by_name} onChange={(e) => setForm({ ...form, requested_by_name: e.target.value })} />
          <TextField label="Requester email" type="email" value={form.requested_by_email} onChange={(e) => setForm({ ...form, requested_by_email: e.target.value })} />
          <Select label="Priority" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as IndentPriority })}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </Select>
          <Select label="Category" value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value as IndentPurpose })}>
            <option value="academic">Academic</option>
            <option value="lab">Lab</option>
            <option value="administrative">Administrative</option>
            <option value="hostel">Hostel</option>
            <option value="project">Project</option>
          </Select>
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-400">Item details</h3>
          <p className="text-sm font-semibold text-ink-900">Est. total ₹{formTotal(form.lines).toLocaleString('en-IN')}</p>
        </div>
        <div className="flex flex-col gap-3">
          {form.lines.map((line, idx) => (
            <div key={idx} className="rounded-xl border border-ink-200 bg-ink-50/40 p-3">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <TextField label="Item name" value={line.item_name} onChange={(e) => patchLine(idx, { item_name: e.target.value })} />
                <TextField label="UOM" value={line.uom} onChange={(e) => patchLine(idx, { uom: e.target.value })} />
                <TextField className="sm:col-span-2" label="Description / specification" value={line.specification} onChange={(e) => patchLine(idx, { specification: e.target.value, description: e.target.value })} />
                <TextField label="Quantity" type="number" value={line.quantity} onChange={(e) => patchLine(idx, { quantity: Number(e.target.value) })} />
                <TextField label="Estimated unit price (₹)" type="number" value={line.estimated_rate} onChange={(e) => patchLine(idx, { estimated_rate: Number(e.target.value) })} />
              </div>
              <p className="mt-2 text-right text-xs text-ink-500">Line total ₹{lineTotal(line).toLocaleString('en-IN')}</p>
            </div>
          ))}
        </div>
        <Button size="sm" variant="secondary" className="mt-2" onClick={() => setForm({ ...form, lines: [...form.lines, emptyLine()] })}>
          + Add item
        </Button>
      </section>

      <section>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-400">Budget · Delivery · Justification</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <TextField label="Budget head / cost centre (optional)" value={form.budget_head} onChange={(e) => setForm({ ...form, budget_head: e.target.value })} />
          <TextField label="Required by date" type="date" value={form.required_by_date} onChange={(e) => setForm({ ...form, required_by_date: e.target.value })} />
          <TextField className="sm:col-span-2" label="Delivery location" value={form.delivery_location} onChange={(e) => setForm({ ...form, delivery_location: e.target.value })} />
          <TextField className="sm:col-span-2" label="Purpose / reason for purchase" value={form.justification} onChange={(e) => setForm({ ...form, justification: e.target.value })} />
          {!editing && (
            <TextField className="sm:col-span-2" label="Supporting document / quotation name (optional)" value={form.attachment_name} onChange={(e) => setForm({ ...form, attachment_name: e.target.value })} placeholder="e.g. Dell quotation Jul 2026.pdf" />
          )}
        </div>
      </section>

      <div className="flex justify-end gap-2 border-t border-ink-100 pt-4">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button
          loading={mutation.isPending}
          disabled={!form.campus_id || !form.department_id || !form.requested_by_name || form.lines.every((l) => !l.item_name)}
          onClick={() => mutation.mutate()}
        >
          {editing ? 'Save changes' : 'Save as draft'}
        </Button>
      </div>
    </div>
  );
}
