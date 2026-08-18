export type AssetClass =
  | 'land'
  | 'building'
  | 'plant_machinery'
  | 'lab_equipment'
  | 'computers'
  | 'furniture'
  | 'vehicles'
  | 'library_books'
  | 'electrical'
  | 'sports';

export type FundingSource = 'institution' | 'grant' | 'project' | 'donation';
export type DepreciationMethod = 'wdv' | 'slm';
export type AssetStatus = 'active' | 'under_repair' | 'transferred' | 'disposed' | 'written_off';

export interface AssetOut {
  id: string;
  asset_code: string;
  institution_id: string;
  campus_id: string;
  campus_name: string;
  division_id: string | null;
  division_name: string;
  department_id: string;
  department_name: string;
  asset_class: AssetClass;
  name: string;
  description: string;
  make: string;
  model: string;
  serial_number: string;
  capitalization_date: string | null;
  capitalization_value: number;
  funding_source: FundingSource;
  supplier_name: string;
  po_id: string | null;
  grn_id: string | null;
  warranty_expiry: string | null;
  amc_expiry: string | null;
  insurance_expiry: string | null;
  custodian_name: string;
  custodian_employee_id: string | null;
  location_building: string;
  location_floor: string;
  location_room: string;
  useful_life_years: number;
  depreciation_method: DepreciationMethod;
  depreciation_rate: number;
  residual_value: number;
  current_book_value: number;
  status: AssetStatus;
  disposal_sale_value: number | null;
  disposal_gain_loss: number | null;
  disposal_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface AssetCreateInput {
  institution_id: string;
  campus_id: string;
  division_id?: string | null;
  department_id: string;
  asset_class: AssetClass;
  name: string;
  description: string;
  make: string;
  model: string;
  serial_number: string;
  capitalization_date: string | null;
  capitalization_value: number;
  funding_source: FundingSource;
  supplier_name: string;
  warranty_expiry: string | null;
  amc_expiry: string | null;
  custodian_name: string;
  location_building: string;
  location_floor: string;
  location_room: string;
  useful_life_years: number;
  depreciation_method: DepreciationMethod;
  depreciation_rate: number;
  residual_value: number;
}

export interface AssetTransferInput {
  custodian_name: string;
  location_building: string;
  location_floor: string;
  location_room: string;
  remarks: string;
}

export interface AssetDisposeInput {
  sale_value: number;
  reason: string;
}

export interface AssetProcurement {
  asset_id: string;
  po_id: string | null;
  po_number: string | null;
  po_status: string | null;
  po_grand_total: number | null;
  payment_terms: string | null;
  vendor_id: string | null;
  vendor_name: string | null;
  vendor_gstin: string | null;
  vendor_category: string | null;
  vendor_msme: boolean | null;
  bill_id: string | null;
  bill_number: string | null;
  bill_status: string | null;
  net_payable: number | null;
  payment_due_date: string | null;
  payment_status: string;
  supplier_name: string;
}

export interface ClassCount {
  asset_class: string;
  count: number;
  total_value: number;
}

export interface StatusCount {
  status: string;
  count: number;
}

export interface AssetsDashboard {
  total_assets: number;
  total_capitalization_value: number;
  total_book_value: number;
  active_count: number;
  under_repair_count: number;
  disposed_count: number;
  warranty_expiring_30d: number;
  amc_expiring_30d: number;
  by_class: ClassCount[];
  by_status: StatusCount[];
}
