import { api } from './api';
import type {
  ComparativeStatement,
  GrnOut,
  IndentCreateInput,
  IndentOut,
  IndentUpdateInput,
  ItemCreateInput,
  ItemOut,
  PurchaseBillOut,
  PurchaseOrderOut,
  QuotationOut,
  VendorCreateInput,
  VendorOut,
  VendorStats,
} from '../types/purchase';

export const vendorApi = {
  list: (institutionId?: string) => api.get<VendorOut[]>('/purchase/vendors', { params: institutionId ? { institution_id: institutionId } : {} }).then((r) => r.data),
  get: (id: string) => api.get<VendorOut>(`/purchase/vendors/${id}`).then((r) => r.data),
  create: (payload: VendorCreateInput) => api.post<VendorOut>('/purchase/vendors', payload).then((r) => r.data),
  update: (id: string, patch: Record<string, unknown>) => api.patch<VendorOut>(`/purchase/vendors/${id}`, patch).then((r) => r.data),
  blacklist: (id: string, reason: string) => api.post<VendorOut>(`/purchase/vendors/${id}/blacklist`, { reason }).then((r) => r.data),
  reinstate: (id: string) => api.post<VendorOut>(`/purchase/vendors/${id}/reinstate`).then((r) => r.data),
  stats: (id: string) => api.get<VendorStats>(`/purchase/vendors/${id}/stats`).then((r) => r.data),
};

export const catalogApi = {
  list: (institutionId?: string) => api.get<ItemOut[]>('/catalog/items', { params: institutionId ? { institution_id: institutionId } : {} }).then((r) => r.data),
  get: (id: string) => api.get<ItemOut>(`/catalog/items/${id}`).then((r) => r.data),
  create: (payload: ItemCreateInput) => api.post<ItemOut>('/catalog/items', payload).then((r) => r.data),
  update: (id: string, patch: Record<string, unknown>) => api.patch<ItemOut>(`/catalog/items/${id}`, patch).then((r) => r.data),
};

export const indentApi = {
  list: (institutionId?: string, status?: string) =>
    api.get<IndentOut[]>('/purchase/indents', { params: { institution_id: institutionId, status } }).then((r) => r.data),
  get: (id: string) => api.get<IndentOut>(`/purchase/indents/${id}`).then((r) => r.data),
  create: (payload: IndentCreateInput) => api.post<IndentOut>('/purchase/indents', payload).then((r) => r.data),
  update: (id: string, payload: IndentUpdateInput) =>
    api.patch<IndentOut>(`/purchase/indents/${id}`, payload).then((r) => r.data),
  submit: (id: string) => api.post<IndentOut>(`/purchase/indents/${id}/submit`).then((r) => r.data),
  approve: (id: string, notes: string) => api.post<IndentOut>(`/purchase/indents/${id}/approve`, { notes }).then((r) => r.data),
  reject: (id: string, notes: string) => api.post<IndentOut>(`/purchase/indents/${id}/reject`, { notes }).then((r) => r.data),
  addAttachment: (id: string, name: string, docType: string) =>
    api.post<IndentOut>(`/purchase/indents/${id}/attachments`, { name, doc_type: docType }).then((r) => r.data),
};

export const quotationApi = {
  list: (institutionId?: string, status?: string) =>
    api.get<QuotationOut[]>('/purchase/quotations', { params: { institution_id: institutionId, status } }).then((r) => r.data),
  get: (id: string) => api.get<QuotationOut>(`/purchase/quotations/${id}`).then((r) => r.data),
  create: (payload: { institution_id: string; indent_id: string; vendor_ids: string[]; procurement_method: string }) =>
    api.post<QuotationOut>('/purchase/quotations', payload).then((r) => r.data),
  recordQuote: (
    id: string,
    payload: { vendor_id: string; lines: { description: string; rate: number; gst_rate: number }[]; freight: number; installation: number; other_charges: number; delivery_days: number; remarks: string },
  ) => api.post<QuotationOut>(`/purchase/quotations/${id}/quotes`, payload).then((r) => r.data),
  comparative: (id: string) => api.get<ComparativeStatement>(`/purchase/quotations/${id}/comparative`).then((r) => r.data),
  award: (id: string, vendorId: string, justification: string) =>
    api.post<QuotationOut>(`/purchase/quotations/${id}/award`, { vendor_id: vendorId, justification }).then((r) => r.data),
};

export const poApi = {
  list: (institutionId?: string, status?: string) =>
    api.get<PurchaseOrderOut[]>('/purchase/orders', { params: { institution_id: institutionId, status } }).then((r) => r.data),
  get: (id: string) => api.get<PurchaseOrderOut>(`/purchase/orders/${id}`).then((r) => r.data),
  createFromQuotation: (
    quotationId: string,
    payload: { delivery_date: string | null; payment_terms: string; warranty_terms: string; penalty_clause: string },
  ) => api.post<PurchaseOrderOut>(`/purchase/orders/from-quotation/${quotationId}`, payload).then((r) => r.data),
  issue: (id: string) => api.post<PurchaseOrderOut>(`/purchase/orders/${id}/issue`).then((r) => r.data),
  cancel: (id: string, reason: string) => api.post<PurchaseOrderOut>(`/purchase/orders/${id}/cancel`, { reason }).then((r) => r.data),
};

export const grnApi = {
  list: (institutionId?: string, poId?: string) =>
    api.get<GrnOut[]>('/purchase/grn', { params: { institution_id: institutionId, po_id: poId } }).then((r) => r.data),
  get: (id: string) => api.get<GrnOut>(`/purchase/grn/${id}`).then((r) => r.data),
  create: (payload: {
    po_id: string;
    vendor_invoice_number: string;
    vendor_invoice_date: string | null;
    lines: { line_index: number; received_qty: number; accepted_qty: number; rejected_qty: number; rejection_reason: string }[];
    remarks: string;
  }) => api.post<GrnOut>('/purchase/grn', payload).then((r) => r.data),
};

export const billApi = {
  list: (institutionId?: string, status?: string) =>
    api.get<PurchaseBillOut[]>('/purchase/bills', { params: { institution_id: institutionId, status } }).then((r) => r.data),
  get: (id: string) => api.get<PurchaseBillOut>(`/purchase/bills/${id}`).then((r) => r.data),
  create: (payload: { grn_id: string; vendor_invoice_number: string; vendor_invoice_date: string }) =>
    api.post<PurchaseBillOut>('/purchase/bills', payload).then((r) => r.data),
  approve: (id: string, notes: string) => api.post<PurchaseBillOut>(`/purchase/bills/${id}/approve`, { notes }).then((r) => r.data),
  hold: (id: string, notes: string) => api.post<PurchaseBillOut>(`/purchase/bills/${id}/hold`, { notes }).then((r) => r.data),
};
