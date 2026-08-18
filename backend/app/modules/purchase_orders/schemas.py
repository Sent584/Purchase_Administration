from datetime import datetime
from enum import Enum

from pydantic import BaseModel


class ProcurementMethod(str, Enum):
    DIRECT = "direct"
    LIMITED_QUOTATION = "limited_quotation"
    RATE_CONTRACT = "rate_contract"
    REPEAT_ORDER = "repeat_order"
    PROPRIETARY = "proprietary"


class PoStatus(str, Enum):
    DRAFT = "draft"
    ISSUED = "issued"
    AMENDED = "amended"
    CANCELLED = "cancelled"
    CLOSED = "closed"


class PoLineInput(BaseModel):
    item_id: str | None = None
    description: str
    hsn_code: str = ""
    quantity: float
    uom: str = "Nos"
    rate: float
    gst_rate: float = 18.0


class PoLine(PoLineInput):
    taxable_amount: float
    cgst_amount: float
    sgst_amount: float
    igst_amount: float
    line_total: float


class PurchaseOrderFromQuotation(BaseModel):
    delivery_date: datetime | None = None
    payment_terms: str = "100% within 30 days of GRN acceptance"
    warranty_terms: str = ""
    penalty_clause: str = "0.5% of order value per week of delay, capped at 5%"


class PurchaseOrderDirectCreate(BaseModel):
    institution_id: str
    vendor_id: str
    procurement_method: ProcurementMethod = ProcurementMethod.DIRECT
    proprietary_certificate_reason: str = ""
    lines: list[PoLineInput]
    delivery_date: datetime | None = None
    payment_terms: str = "100% within 30 days of GRN acceptance"
    warranty_terms: str = ""
    penalty_clause: str = "0.5% of order value per week of delay, capped at 5%"


class PurchaseOrderOut(BaseModel):
    id: str
    po_number: str
    version: int
    institution_id: str
    vendor_id: str
    vendor_name: str
    vendor_gstin: str
    quotation_id: str | None
    indent_id: str | None
    campus_id: str | None = None
    campus_name: str = ""
    division_id: str | None = None
    division_name: str = ""
    department_id: str | None = None
    department_name: str = ""
    procurement_method: ProcurementMethod
    proprietary_certificate_reason: str
    place_of_supply: str
    lines: list[PoLine]
    subtotal: float
    total_gst: float
    grand_total: float
    delivery_date: datetime | None
    payment_terms: str
    warranty_terms: str
    penalty_clause: str
    status: PoStatus
    cancellation_reason: str | None = None
    created_at: datetime
    updated_at: datetime
