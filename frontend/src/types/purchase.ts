// ------------------------------------------------------------------- Vendors

export interface VendorAddress {
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

export interface BankAccount {
  account_holder: string;
  account_number: string;
  ifsc_code: string;
  bank_name: string;
  branch: string;
}

export interface VendorRating {
  quality: number;
  delivery: number;
  price: number;
  service: number;
  overall: number;
}

export type VendorCategory = 'goods' | 'services' | 'works' | 'annual_maintenance';
export type GstRegistrationType = 'regular' | 'composition' | 'unregistered';
export type TdsSection = 'none' | '194C' | '194J' | '194I' | '194Q';
export type VendorStatus = 'active' | 'inactive' | 'blacklisted';

export interface VendorDocument {
  name: string;
  doc_type: string;
  reference_number: string;
  issued_date: string | null;
  expiry_date: string | null;
}

export interface VendorOut {
  id: string;
  code: string;
  institution_id: string;
  legal_name: string;
  trade_name: string;
  vendor_category: VendorCategory;
  gst_registration_type: GstRegistrationType;
  gstin: string;
  pan: string;
  msme_registered: boolean;
  udyam_number: string;
  tds_section: TdsSection;
  lower_deduction_certificate_rate: number | null;
  address: VendorAddress;
  contact_person: string;
  contact_phone: string;
  contact_email: string | null;
  secondary_contact_person: string;
  secondary_contact_phone: string;
  credit_period_days: number;
  delivery_lead_time_days: number;
  quality_certifications: string[];
  bank_account: BankAccount;
  product_categories: string[];
  documents: VendorDocument[];
  empanelment_valid_from: string | null;
  empanelment_valid_to: string | null;
  status: VendorStatus;
  rating: VendorRating;
  blacklist_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface VendorCreateInput {
  institution_id: string;
  legal_name: string;
  trade_name: string;
  vendor_category: VendorCategory;
  gst_registration_type: GstRegistrationType;
  gstin: string;
  pan: string;
  msme_registered: boolean;
  udyam_number: string;
  tds_section: TdsSection;
  address: VendorAddress;
  contact_person: string;
  contact_phone: string;
  contact_email: string;
  secondary_contact_person: string;
  secondary_contact_phone: string;
  credit_period_days: number;
  delivery_lead_time_days: number;
  quality_certifications: string[];
  bank_account: BankAccount;
  product_categories: string[];
}

export interface VendorStats {
  vendor_id: string;
  total_purchase_orders: number;
  total_po_value: number;
  total_grns: number;
  total_bills: number;
  total_billed_value: number;
  on_time_grn_pct: number;
  quality_acceptance_pct: number;
}

// --------------------------------------------------------------- Catalog

export type ItemCategory =
  | 'consumable' | 'lab_chemical' | 'glassware' | 'stationery' | 'electrical'
  | 'it_consumable' | 'sports' | 'housekeeping' | 'medical' | 'furniture' | 'capital' | 'service';

export interface ItemOut {
  id: string;
  code: string;
  institution_id: string;
  name: string;
  category: ItemCategory;
  uom: string;
  hsn_code: string;
  gst_rate: number;
  standard_rate: number;
  specification: string;
  reorder_level: number;
  is_capital_item: boolean;
  manufacturer: string;
  model_number: string;
  warranty_months: number;
  minimum_order_quantity: number;
  lead_time_days: number;
  preferred_vendor_ids: string[];
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface ItemCreateInput {
  institution_id: string;
  name: string;
  category: ItemCategory;
  uom: string;
  hsn_code: string;
  gst_rate: number;
  standard_rate: number;
  specification: string;
  reorder_level: number;
  is_capital_item: boolean;
  manufacturer: string;
  model_number: string;
  warranty_months: number;
  minimum_order_quantity: number;
  lead_time_days: number;
  preferred_vendor_ids: string[];
}

// --------------------------------------------------------------- Indents

export type IndentPurpose = 'academic' | 'lab' | 'administrative' | 'hostel' | 'project';
export type IndentPriority = 'low' | 'medium' | 'high' | 'urgent';
export type IndentStatus = 'draft' | 'submitted' | 'approved' | 'rejected' | 'closed';
export type ApprovalLevelStatus = 'pending' | 'approved' | 'rejected';

export interface IndentLine {
  item_id: string | null;
  item_name: string;
  description: string;
  specification: string;
  quantity: number;
  uom: string;
  estimated_rate: number;
  estimated_amount: number;
}

export interface IndentAttachment {
  name: string;
  doc_type: string;
  uploaded_by: string;
  uploaded_at: string;
}

export interface ApprovalLevel {
  level: number;
  level_name: string;
  status: ApprovalLevelStatus;
  approver_email: string | null;
  notes: string;
  decided_at: string | null;
}

export interface IndentOut {
  id: string;
  indent_number: string;
  institution_id: string;
  campus_id: string;
  campus_name: string;
  division_id: string | null;
  division_name: string;
  department_id: string;
  department_name: string;
  requested_by_name: string;
  requested_by_email: string;
  purpose: IndentPurpose;
  priority: IndentPriority;
  requisition_date: string | null;
  required_by_date: string | null;
  delivery_location: string;
  budget_head: string;
  justification: string;
  remarks: string;
  lines: IndentLine[];
  attachments: IndentAttachment[];
  approval_chain: ApprovalLevel[];
  status: IndentStatus;
  approver_notes: string;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
  total_estimated_amount: number;
}

export interface IndentLineInput {
  item_id: string | null;
  item_name: string;
  description: string;
  specification: string;
  quantity: number;
  uom: string;
  estimated_rate: number;
}

export interface IndentCreateInput {
  institution_id: string;
  campus_id: string;
  department_id: string;
  division_id?: string | null;
  requested_by_name: string;
  requested_by_email: string;
  purpose: IndentPurpose;
  priority: IndentPriority;
  requisition_date?: string | null;
  required_by_date?: string | null;
  delivery_location: string;
  budget_head: string;
  justification: string;
  remarks: string;
  lines: IndentLineInput[];
  attachments?: { name: string; doc_type: string }[];
}

export type IndentUpdateInput = Partial<
  Omit<IndentCreateInput, 'institution_id' | 'attachments'>
> & { attachments?: IndentAttachment[] };


// ----------------------------------------------------------- Quotations

export type ProcurementMethod = 'direct' | 'limited_quotation' | 'rate_contract' | 'repeat_order' | 'proprietary';
export type QuotationStatus = 'draft' | 'rfq_sent' | 'quotes_received' | 'awarded' | 'cancelled';

export interface RfqLine {
  item_id: string | null;
  description: string;
  quantity: number;
  uom: string;
}

export interface QuoteLine {
  description: string;
  rate: number;
  gst_rate: number;
}

export interface VendorQuote {
  vendor_id: string;
  lines: QuoteLine[];
  freight: number;
  installation: number;
  other_charges: number;
  delivery_days: number;
  remarks: string;
  submitted_at: string;
}

export interface OrgScopeFields {
  campus_id: string | null;
  campus_name: string;
  division_id: string | null;
  division_name: string;
  department_id: string | null;
  department_name: string;
}

export interface QuotationOut extends OrgScopeFields {
  id: string;
  rfq_number: string;
  institution_id: string;
  indent_id: string;
  vendor_ids: string[];
  procurement_method: ProcurementMethod;
  lines: RfqLine[];
  quotes: VendorQuote[];
  status: QuotationStatus;
  awarded_vendor_id: string | null;
  award_justification: string;
  created_at: string;
  updated_at: string;
}

export interface ComparativeRow {
  vendor_id: string;
  vendor_name: string;
  lines_total: number;
  freight: number;
  installation: number;
  other_charges: number;
  gst_amount: number;
  rank: number;
  is_l1: boolean;
  delivery_days: number;
  remarks: string;
  landed_cost: number;
}

export interface ComparativeStatement {
  quotation_id: string;
  rfq_number: string;
  rows: ComparativeRow[];
  l1_vendor_id: string | null;
}

// ------------------------------------------------------------ Purchase Orders

export type PoStatus = 'draft' | 'issued' | 'amended' | 'cancelled' | 'closed';

export interface PoLine {
  item_id: string | null;
  description: string;
  hsn_code: string;
  quantity: number;
  uom: string;
  rate: number;
  gst_rate: number;
  taxable_amount: number;
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
  line_total: number;
}

export interface PurchaseOrderOut extends OrgScopeFields {
  id: string;
  po_number: string;
  version: number;
  institution_id: string;
  vendor_id: string;
  vendor_name: string;
  vendor_gstin: string;
  quotation_id: string | null;
  indent_id: string | null;
  procurement_method: ProcurementMethod;
  proprietary_certificate_reason: string;
  place_of_supply: string;
  lines: PoLine[];
  subtotal: number;
  total_gst: number;
  grand_total: number;
  delivery_date: string | null;
  payment_terms: string;
  warranty_terms: string;
  penalty_clause: string;
  status: PoStatus;
  cancellation_reason: string | null;
  created_at: string;
  updated_at: string;
}

// ------------------------------------------------------------------- GRN

export type QualityStatus = 'accepted' | 'partial' | 'rejected';

export interface GrnLine {
  line_index: number;
  received_qty: number;
  accepted_qty: number;
  rejected_qty: number;
  rejection_reason: string;
  description: string;
  uom: string;
  ordered_qty: number;
}

export interface GrnOut extends OrgScopeFields {
  id: string;
  grn_number: string;
  po_id: string;
  po_number: string;
  institution_id: string;
  vendor_id: string;
  vendor_name: string;
  received_date: string;
  vendor_invoice_number: string;
  vendor_invoice_date: string | null;
  lines: GrnLine[];
  quality_status: QualityStatus;
  remarks: string;
  created_at: string;
}

// ---------------------------------------------------------------- Bills

export type BillStatus = 'booked' | 'approved' | 'on_hold';

export interface BillLine {
  description: string;
  quantity: number;
  uom: string;
  rate: number;
  taxable_amount: number;
  gst_rate: number;
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
  line_total: number;
}

export interface PurchaseBillOut extends OrgScopeFields {
  id: string;
  bill_number: string;
  po_id: string;
  po_number: string;
  grn_id: string;
  grn_number: string;
  institution_id: string;
  vendor_id: string;
  vendor_name: string;
  vendor_gstin: string;
  vendor_invoice_number: string;
  vendor_invoice_date: string;
  lines: BillLine[];
  taxable_amount: number;
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
  gross_amount: number;
  tds_section: TdsSection;
  tds_rate: number;
  tds_amount: number;
  net_payable: number;
  msme_registered: boolean;
  payment_due_date: string;
  three_way_match_status: string;
  status: BillStatus;
  approver_notes: string;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
}
