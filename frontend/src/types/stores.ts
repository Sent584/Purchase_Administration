export type StoreType = 'central' | 'department' | 'laboratory' | 'hostel' | 'sports' | 'maintenance';
export type StoreStatus = 'active' | 'inactive';

export type StockTxnType =
  | 'opening'
  | 'issue'
  | 'issue_return'
  | 'transfer_out'
  | 'transfer_in'
  | 'adjustment'
  | 'write_off'
  | 'grn_receipt';

export type StockTxnStatus = 'posted' | 'approved' | 'cancelled';

export interface OrgStockScope {
  campus_id?: string | null;
  campus_name?: string;
  division_id?: string | null;
  division_name?: string;
  department_id?: string | null;
  department_name?: string;
}

export interface StoreOut {
  id: string;
  institution_id: string;
  campus_id: string;
  code: string;
  name: string;
  store_type: StoreType;
  location: string;
  in_charge_name: string;
  status: StoreStatus;
  created_at: string;
  updated_at: string;
}

export interface StoreCreateInput {
  institution_id: string;
  campus_id: string;
  code: string;
  name: string;
  store_type: StoreType;
  location: string;
  in_charge_name: string;
}

export interface StockBalanceOut extends OrgStockScope {
  item_id: string;
  item_code: string;
  item_name: string;
  store_id: string;
  store_name: string;
  institution_id: string;
  quantity: number;
  uom: string;
  reorder_level: number;
  last_rate: number;
  valuation: number;
}

export interface StockTxnCreateInput extends OrgStockScope {
  store_id: string;
  txn_type: StockTxnType;
  item_id: string;
  quantity: number;
  uom: string;
  rate: number;
  reference_type: string;
  reference_id: string;
  remarks: string;
  to_store_id: string | null;
  issued_to: string;
}

export interface StockTxnOut extends OrgStockScope {
  id: string;
  txn_number: string;
  store_id: string;
  store_name: string;
  txn_type: StockTxnType;
  item_id: string;
  item_code: string;
  item_name: string;
  quantity: number;
  uom: string;
  rate: number;
  amount: number;
  reference_type: string;
  reference_id: string;
  remarks: string;
  to_store_id: string | null;
  to_store_name: string | null;
  issued_to: string;
  status: StockTxnStatus;
  institution_id: string;
  created_at: string;
  updated_at: string;
}

export interface StoresDashboard {
  store_count: number;
  item_count: number;
  total_stock_value: number;
  below_reorder: number;
  pending_issues: number;
  recent_txns: StockTxnOut[];
}
