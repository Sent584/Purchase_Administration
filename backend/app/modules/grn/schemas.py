from datetime import datetime
from enum import Enum

from pydantic import BaseModel


class QualityStatus(str, Enum):
    ACCEPTED = "accepted"
    PARTIAL = "partial"
    REJECTED = "rejected"


class GrnLineInput(BaseModel):
    line_index: int
    received_qty: float
    accepted_qty: float
    rejected_qty: float = 0
    rejection_reason: str = ""


class GrnLine(GrnLineInput):
    description: str
    uom: str
    ordered_qty: float


class GrnCreate(BaseModel):
    po_id: str
    vendor_invoice_number: str = ""
    vendor_invoice_date: datetime | None = None
    lines: list[GrnLineInput]
    remarks: str = ""


class GrnOut(BaseModel):
    id: str
    grn_number: str
    po_id: str
    po_number: str
    institution_id: str
    vendor_id: str
    vendor_name: str
    campus_id: str | None = None
    campus_name: str = ""
    division_id: str | None = None
    division_name: str = ""
    department_id: str | None = None
    department_name: str = ""
    received_date: datetime
    vendor_invoice_number: str
    vendor_invoice_date: datetime | None
    lines: list[GrnLine]
    quality_status: QualityStatus
    remarks: str
    created_at: datetime
