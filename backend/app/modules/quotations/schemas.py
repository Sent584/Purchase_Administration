from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field, computed_field


class ProcurementMethod(str, Enum):
    DIRECT = "direct"
    LIMITED_QUOTATION = "limited_quotation"
    RATE_CONTRACT = "rate_contract"
    REPEAT_ORDER = "repeat_order"
    PROPRIETARY = "proprietary"


class QuotationStatus(str, Enum):
    DRAFT = "draft"
    RFQ_SENT = "rfq_sent"
    QUOTES_RECEIVED = "quotes_received"
    AWARDED = "awarded"
    CANCELLED = "cancelled"


class RfqLine(BaseModel):
    item_id: str | None = None
    description: str
    quantity: float
    uom: str = "Nos"


class QuoteLine(BaseModel):
    description: str
    rate: float
    gst_rate: float = 18.0


class VendorQuoteInput(BaseModel):
    vendor_id: str
    lines: list[QuoteLine]
    freight: float = 0
    installation: float = 0
    other_charges: float = 0
    delivery_days: int = 0
    remarks: str = ""


class VendorQuote(BaseModel):
    vendor_id: str
    lines: list[QuoteLine]
    freight: float = 0
    installation: float = 0
    other_charges: float = 0
    delivery_days: int = 0
    remarks: str = ""
    submitted_at: datetime


class QuotationCreate(BaseModel):
    institution_id: str
    indent_id: str
    vendor_ids: list[str] = Field(default_factory=list)
    procurement_method: ProcurementMethod = ProcurementMethod.LIMITED_QUOTATION


class QuotationAward(BaseModel):
    vendor_id: str
    justification: str = ""


class QuotationOut(BaseModel):
    id: str
    rfq_number: str
    institution_id: str
    indent_id: str
    campus_id: str | None = None
    campus_name: str = ""
    division_id: str | None = None
    division_name: str = ""
    department_id: str | None = None
    department_name: str = ""
    vendor_ids: list[str]
    procurement_method: ProcurementMethod
    lines: list[RfqLine]
    quotes: list[VendorQuote]
    status: QuotationStatus
    awarded_vendor_id: str | None
    award_justification: str
    created_at: datetime
    updated_at: datetime


class ComparativeRow(BaseModel):
    vendor_id: str
    vendor_name: str
    lines_total: float
    freight: float
    installation: float
    other_charges: float
    gst_amount: float
    rank: int
    is_l1: bool
    delivery_days: int
    remarks: str

    @computed_field  # type: ignore[prop-decorator]
    @property
    def landed_cost(self) -> float:
        return round(self.lines_total + self.freight + self.installation + self.other_charges + self.gst_amount, 2)


class ComparativeStatement(BaseModel):
    quotation_id: str
    rfq_number: str
    rows: list[ComparativeRow]
    l1_vendor_id: str | None
