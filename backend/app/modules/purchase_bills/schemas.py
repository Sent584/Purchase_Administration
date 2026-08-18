from datetime import datetime
from enum import Enum

from pydantic import BaseModel


class BillStatus(str, Enum):
    BOOKED = "booked"
    APPROVED = "approved"
    ON_HOLD = "on_hold"


class BillLine(BaseModel):
    description: str
    quantity: float
    uom: str
    rate: float
    taxable_amount: float
    gst_rate: float
    cgst_amount: float
    sgst_amount: float
    igst_amount: float
    line_total: float


class PurchaseBillCreate(BaseModel):
    grn_id: str
    vendor_invoice_number: str
    vendor_invoice_date: datetime


class PurchaseBillDecision(BaseModel):
    notes: str = ""


class PurchaseBillOut(BaseModel):
    id: str
    bill_number: str
    po_id: str
    po_number: str
    grn_id: str
    grn_number: str
    institution_id: str
    vendor_id: str
    vendor_name: str
    vendor_gstin: str
    campus_id: str | None = None
    campus_name: str = ""
    division_id: str | None = None
    division_name: str = ""
    department_id: str | None = None
    department_name: str = ""
    vendor_invoice_number: str
    vendor_invoice_date: datetime
    lines: list[BillLine]
    taxable_amount: float
    cgst_amount: float
    sgst_amount: float
    igst_amount: float
    gross_amount: float
    tds_section: str
    tds_rate: float
    tds_amount: float
    net_payable: float
    msme_registered: bool
    payment_due_date: datetime
    three_way_match_status: str
    status: BillStatus
    approver_notes: str
    approved_by: str | None
    approved_at: datetime | None
    created_at: datetime
