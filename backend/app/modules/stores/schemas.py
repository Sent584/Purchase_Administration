from datetime import datetime
from enum import Enum

from pydantic import BaseModel


class StoreType(str, Enum):
    CENTRAL = "central"
    DEPARTMENT = "department"
    LABORATORY = "laboratory"
    HOSTEL = "hostel"
    SPORTS = "sports"
    MAINTENANCE = "maintenance"


class StoreStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"


class StockTxnType(str, Enum):
    OPENING = "opening"
    ISSUE = "issue"
    ISSUE_RETURN = "issue_return"
    TRANSFER_OUT = "transfer_out"
    TRANSFER_IN = "transfer_in"
    ADJUSTMENT = "adjustment"
    WRITE_OFF = "write_off"
    GRN_RECEIPT = "grn_receipt"


class StockTxnStatus(str, Enum):
    POSTED = "posted"
    APPROVED = "approved"
    CANCELLED = "cancelled"


class StoreCreate(BaseModel):
    institution_id: str
    campus_id: str
    code: str
    name: str
    store_type: StoreType = StoreType.CENTRAL
    location: str = ""
    in_charge_name: str = ""


class StoreUpdate(BaseModel):
    name: str | None = None
    store_type: StoreType | None = None
    location: str | None = None
    in_charge_name: str | None = None
    status: StoreStatus | None = None


class StoreOut(BaseModel):
    id: str
    institution_id: str
    campus_id: str
    code: str
    name: str
    store_type: StoreType
    location: str
    in_charge_name: str
    status: StoreStatus
    created_at: datetime
    updated_at: datetime


class StockBalanceOut(BaseModel):
    item_id: str
    item_code: str
    item_name: str
    store_id: str
    store_name: str
    institution_id: str
    campus_id: str | None = None
    campus_name: str = ""
    division_id: str | None = None
    division_name: str = ""
    department_id: str | None = None
    department_name: str = ""
    quantity: float
    uom: str
    reorder_level: float
    last_rate: float
    valuation: float


class StockTxnCreate(BaseModel):
    store_id: str
    txn_type: StockTxnType
    item_id: str
    quantity: float  # absolute for most types; signed delta for adjustment
    uom: str = "Nos"
    rate: float = 0
    reference_type: str = ""
    reference_id: str = ""
    remarks: str = ""
    to_store_id: str | None = None
    department_id: str | None = None
    department_name: str = ""
    campus_id: str | None = None
    campus_name: str = ""
    division_id: str | None = None
    division_name: str = ""
    issued_to: str = ""


class StockTxnOut(BaseModel):
    id: str
    txn_number: str
    store_id: str
    store_name: str
    txn_type: StockTxnType
    item_id: str
    item_code: str
    item_name: str
    quantity: float
    uom: str
    rate: float
    amount: float
    reference_type: str
    reference_id: str
    remarks: str
    to_store_id: str | None
    to_store_name: str | None
    campus_id: str | None = None
    campus_name: str = ""
    division_id: str | None = None
    division_name: str = ""
    department_id: str | None
    department_name: str = ""
    issued_to: str
    status: StockTxnStatus
    institution_id: str
    created_at: datetime
    updated_at: datetime


class StoresDashboard(BaseModel):
    store_count: int
    item_count: int
    total_stock_value: float
    below_reorder: int
    pending_issues: int
    recent_txns: list[StockTxnOut]
