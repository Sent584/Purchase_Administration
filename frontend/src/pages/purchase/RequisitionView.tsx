import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '../../components/ui/Button';
import { TextField } from '../../components/ui/TextField';
import { Badge } from '../../components/ui/Badge';
import { ApprovalTimeline, type TimelineStep } from '../../components/documents/ApprovalTimeline';
import { DocumentHeader, DocumentFooter, DocumentDisclaimer } from '../../components/documents/DocumentLetterhead';
import { DocumentPrintShell } from '../../components/documents/DocumentPrintShell';
import { indentApi } from '../../lib/purchaseApi';
import { useAuthStore } from '../../state/authStore';
import type { IndentOut } from '../../types/purchase';
import { formatPrDate, prPriorityTone, prStatusTone } from './requisitionHelpers';

function buildTimeline(pr: IndentOut): TimelineStep[] {
  const steps: TimelineStep[] = [
    { label: 'Draft created', status: 'done', timestamp: pr.created_at },
    {
      label: 'Submitted for approval',
      status: pr.status === 'draft' ? 'pending' : 'done',
      timestamp: pr.status === 'draft' ? null : pr.updated_at,
    },
  ];
  for (const level of pr.approval_chain) {
    steps.push({
      label: level.level_name,
      status:
        level.status === 'approved'
          ? 'done'
          : level.status === 'rejected'
            ? 'rejected'
            : pr.status === 'submitted'
              ? 'current'
              : 'pending',
      actor: level.approver_email,
      timestamp: level.decided_at,
      notes: level.notes,
    });
  }
  return steps;
}

export function RequisitionView({
  pr,
  onChanged,
  onEdit,
}: {
  pr: IndentOut;
  onChanged: () => void;
  onEdit?: () => void;
}) {
  const canWrite = useAuthStore((s) => s.hasPermission('indent:write'));
  const canApprove = useAuthStore((s) => s.hasPermission('indent:approve'));
  const [notes, setNotes] = useState('');
  const submitMutation = useMutation({ mutationFn: () => indentApi.submit(pr.id), onSuccess: onChanged });
  const approveMutation = useMutation({ mutationFn: () => indentApi.approve(pr.id, notes), onSuccess: onChanged });
  const rejectMutation = useMutation({ mutationFn: () => indentApi.reject(pr.id, notes), onSuccess: onChanged });

  return (
    <div className="space-y-5">
      <DocumentPrintShell documentTitle={`Purchase Requisition ${pr.indent_number}`} fileName={pr.indent_number}>
        <div className="rounded-xl border border-ink-200 bg-white p-4">
          <DocumentHeader
            institutionId={pr.institution_id}
            documentTitle="Purchase Requisition"
            documentNumber={pr.indent_number}
            documentDate={pr.requisition_date ?? pr.created_at}
            statusNode={<Badge tone={prStatusTone(pr.status)}>{pr.status}</Badge>}
          />
          <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
            <div><p className="text-xs text-ink-400">Campus</p><p className="font-medium text-ink-900">{pr.campus_name || '—'}</p></div>
            <div><p className="text-xs text-ink-400">Division</p><p className="font-medium text-ink-900">{pr.division_name || '—'}</p></div>
            <div><p className="text-xs text-ink-400">Department</p><p className="font-medium text-ink-900">{pr.department_name || '—'}</p></div>
            <div><p className="text-xs text-ink-400">Requested by</p><p className="font-medium text-ink-900">{pr.requested_by_name}</p></div>
            <div><p className="text-xs text-ink-400">Priority</p><Badge tone={prPriorityTone(pr.priority)}>{pr.priority}</Badge></div>
            <div><p className="text-xs text-ink-400">Required by</p><p className="font-medium text-ink-900">{formatPrDate(pr.required_by_date)}</p></div>
            <div className="col-span-2"><p className="text-xs text-ink-400">Delivery location</p><p className="font-medium text-ink-900">{pr.delivery_location || '—'}</p></div>
            <div className="col-span-2"><p className="text-xs text-ink-400">Budget head</p><p className="font-medium text-ink-900">{pr.budget_head || '—'}</p></div>
            <div className="col-span-2"><p className="text-xs text-ink-400">Purpose / reason</p><p className="text-ink-800">{pr.justification || pr.remarks || '—'}</p></div>
          </div>
          <div className="mt-4 overflow-x-auto rounded-xl border border-ink-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-100 bg-ink-50 text-left text-xs uppercase text-ink-400">
                  <th className="px-3 py-2">Item</th>
                  <th className="px-3 py-2">Description</th>
                  <th className="px-3 py-2">Qty</th>
                  <th className="px-3 py-2">UOM</th>
                  <th className="px-3 py-2 text-right">Unit price</th>
                  <th className="px-3 py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {pr.lines.map((l, i) => (
                  <tr key={i}>
                    <td className="px-3 py-2 font-medium text-ink-900">{l.item_name || l.description}</td>
                    <td className="px-3 py-2 text-ink-600">{l.specification || l.description}</td>
                    <td className="px-3 py-2 text-ink-700">{l.quantity}</td>
                    <td className="px-3 py-2 text-ink-600">{l.uom}</td>
                    <td className="px-3 py-2 text-right text-ink-700">₹{l.estimated_rate.toLocaleString('en-IN')}</td>
                    <td className="px-3 py-2 text-right font-medium text-ink-900">₹{l.estimated_amount.toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-ink-50">
                  <td colSpan={5} className="px-3 py-2 text-right text-sm font-semibold text-ink-700">Estimated total</td>
                  <td className="px-3 py-2 text-right text-sm font-semibold text-crimson-700">₹{pr.total_estimated_amount.toLocaleString('en-IN')}</td>
                </tr>
              </tfoot>
            </table>
          </div>
          {pr.attachments.length > 0 && (
            <div className="mt-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-400">Attachments</p>
              <ul className="space-y-1 text-sm text-ink-700">
                {pr.attachments.map((a, i) => (
                  <li key={i}>{a.name} ({a.doc_type})</li>
                ))}
              </ul>
            </div>
          )}
          <div className="mt-4">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">Approval</p>
              {pr.approved_by && <span className="text-xs text-ink-500">Approver: {pr.approved_by}</span>}
            </div>
            {pr.approver_notes && <p className="mb-2 text-sm text-ink-600">Remarks: {pr.approver_notes}</p>}
            <ApprovalTimeline steps={buildTimeline(pr)} />
          </div>
          <DocumentFooter documentType="purchase_requisition" documentNumber={pr.indent_number} approvedBy={pr.approved_by} />
          <DocumentDisclaimer />
        </div>
      </DocumentPrintShell>

      <div className="no-print flex flex-wrap gap-2 border-t border-ink-100 pt-4">
        {pr.status === 'draft' && canWrite && (
          <>
            {onEdit && <Button variant="secondary" onClick={onEdit}>Edit</Button>}
            <Button loading={submitMutation.isPending} onClick={() => submitMutation.mutate()}>Submit for approval</Button>
          </>
        )}
        {pr.status === 'submitted' && canApprove && (
          <>
            <TextField className="w-full" label="Approval remarks" value={notes} onChange={(e) => setNotes(e.target.value)} />
            <Button size="sm" loading={approveMutation.isPending} onClick={() => approveMutation.mutate()}>Approve</Button>
            <Button size="sm" variant="danger" loading={rejectMutation.isPending} onClick={() => rejectMutation.mutate()}>Reject</Button>
          </>
        )}
      </div>
    </div>
  );
}
